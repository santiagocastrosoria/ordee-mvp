import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { createCheckoutProPreference } from "@/lib/mercadopago-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CartItem } from "@/lib/types";

const TAG = "[mp/create-preference]";

interface Body {
  restaurantSlug?: string;
  customerName: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
}

export async function POST(request: NextRequest) {
  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch (parseErr) {
    console.error(TAG, "body parse error", parseErr);
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  console.info(TAG, "[mp session insert start]", {
    customerName: body.customerName,
    table: body.tableNumber,
    itemsCount: Array.isArray(body.items) ? body.items.length : "NOT_ARRAY",
    hasNotes: Boolean(body.notes?.trim()),
    slug: body.restaurantSlug
  });

  if (!body.customerName?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
    const detail = !body.customerName?.trim() ? "falta customerName" : "items vacío o no es array";
    console.error(TAG, "validación fallida", detail);
    return NextResponse.json({ error: "Datos inválidos", detail }, { status: 400 });
  }

  // ── 2. Supabase admin client ──────────────────────────────────────────────
  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
    console.info(TAG, "admin client OK");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(TAG, "admin client FALLA — env var faltante?", msg);
    return NextResponse.json(
      { error: "Configuración de servidor inválida", detail: msg, hint: "Verificá SUPABASE_SERVICE_ROLE_KEY en las variables de entorno." },
      { status: 500 }
    );
  }

  // ── 3. Ensure restaurant ──────────────────────────────────────────────────
  const slug = body.restaurantSlug ?? getDefaultRestaurantSlug();
  console.info(TAG, "ensureRestaurant slug=", slug);

  const ensured = await ensureRestaurantBySlug(supabase, slug);
  if (!ensured.ok) {
    console.error(TAG, "ensureRestaurant FALLA", ensured);
    return NextResponse.json(
      { error: "No se pudo obtener el restaurante", detail: ensured.message, slug },
      { status: 500 }
    );
  }
  console.info(TAG, "restaurant_id=", ensured.id);

  // ── 4. Calculate total (always integer ARS — no floating point) ───────────
  const totalRaw = body.items.reduce((acc, e) => acc + e.quantity * e.item.price, 0);
  const total = Math.round(totalRaw); // guard against float prices like 3100.5

  if (total <= 0) {
    console.error(TAG, "total inválido total=", total, "raw=", totalRaw);
    return NextResponse.json({ error: "Total inválido", detail: `total=${totalRaw}` }, { status: 400 });
  }
  console.info(TAG, "total ARS=", total);

  // ── 5. Insert mp_checkout_sessions ────────────────────────────────────────
  console.info(TAG, "[mp session insert start] restaurant_id=", ensured.id, "total=", total);

  const insertPayload = {
    restaurant_id: ensured.id,
    customer_name: body.customerName.trim(),
    table_number: body.tableNumber?.trim() || null,
    notes: body.notes?.trim() || null,
    items: body.items as unknown as Record<string, unknown>[],
    total_ars: total,
    payment_method: "mercado_pago",
    status: "pending"
  };

  const { data: session, error: sessionError } = await supabase
    .from("mp_checkout_sessions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error(TAG, "[mp session insert failed]", {
      error: sessionError,
      errorCode: sessionError?.code,
      errorMessage: sessionError?.message,
      errorDetails: sessionError?.details,
      hint: sessionError?.hint
    });

    const isTableMissing = sessionError?.code === "42P01";
    return NextResponse.json(
      {
        error: "No se pudo crear sesión de pago",
        detail: sessionError?.message ?? "session null sin error",
        code: sessionError?.code,
        hint: isTableMissing
          ? "La tabla mp_checkout_sessions no existe. Ejecutá supabase/012_mp_checkout_sessions.sql y supabase/013_mp_sessions_patch.sql en el SQL Editor de Supabase."
          : (sessionError?.hint ?? "Verificá el schema y las variables de entorno en Vercel.")
      },
      { status: 500 }
    );
  }

  const sessionId = session.id as string;
  console.info(TAG, "[mp session inserted]", { sessionId, restaurantId: ensured.id, total });
  console.info(TAG, "[session id]", sessionId);

  // ── 6. Build URLs ─────────────────────────────────────────────────────────
  const appUrl = getAppBaseUrl();
  const notificationUrl = `${appUrl}/api/mercadopago/webhook`;

  console.info(TAG, "notificationUrl=", notificationUrl, "backUrl base=", appUrl);

  // MP requires integer unit_price for ARS; round defensively
  const mpItems = body.items.map((entry) => ({
    title: entry.item.name.slice(0, 256),
    quantity: entry.quantity,
    unit_price: Math.round(entry.item.price)
  }));

  // ── 7. Create MercadoPago preference ─────────────────────────────────────
  const pref = await createCheckoutProPreference({
    sessionId,
    items: mpItems,
    notificationUrl,
    backUrls: {
      success: `${appUrl}/checkout?mp=success&sessionId=${sessionId}`,
      failure: `${appUrl}/checkout?mp=failure&sessionId=${sessionId}`,
      pending: `${appUrl}/checkout?mp=pending&sessionId=${sessionId}`
    }
  });

  if (pref.error || !pref.checkoutUrl) {
    console.error(TAG, "MP preference FALLA — marcando session failed", { error: pref.error, sessionId });
    await supabase
      .from("mp_checkout_sessions")
      .update({ status: "failed" })
      .eq("id", sessionId);
    return NextResponse.json(
      { error: "No se pudo crear preferencia en Mercado Pago", detail: pref.error },
      { status: 500 }
    );
  }

  console.info(TAG, "[mp preference created]", {
    preferenceId: pref.preferenceId,
    sessionId,
    total,
    ts: new Date().toISOString()
  });

  return NextResponse.json({
    sessionId,
    preferenceId: pref.preferenceId,
    checkoutUrl: pref.checkoutUrl
  });
}
