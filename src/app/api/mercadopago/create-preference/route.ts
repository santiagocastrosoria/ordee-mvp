import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { createCheckoutProPreference } from "@/lib/mercadopago-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CartItem } from "@/lib/types";

const TAG = "[ORDEE api/mercadopago/create-preference]";

interface Body {
  restaurantSlug?: string;
  customerName: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;

  if (!body.customerName?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const slug = body.restaurantSlug ?? getDefaultRestaurantSlug();
  const ensured = await ensureRestaurantBySlug(supabase, slug);
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.message }, { status: 500 });
  }

  const total = body.items.reduce((acc, e) => acc + e.quantity * e.item.price, 0);
  if (total <= 0) {
    return NextResponse.json({ error: "Total invalido" }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("mp_checkout_sessions")
    .insert({
      restaurant_id: ensured.id,
      customer_name: body.customerName.trim(),
      table_number: body.tableNumber?.trim() || null,
      notes: body.notes?.trim() || null,
      items: body.items,
      total_ars: total,
      payment_method: "mercado_pago",
      status: "pending"
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error(TAG, "session insert", sessionError);
    return NextResponse.json(
      {
        error: "No se pudo iniciar checkout",
        detail: sessionError?.message,
        hint: "Ejecutá supabase/012_mp_checkout_sessions.sql si falta la tabla."
      },
      { status: 500 }
    );
  }

  const sessionId = session.id as string;
  const appUrl = getAppBaseUrl();
  const notificationUrl = `${appUrl}/api/mercadopago/webhook`;

  const mpItems = body.items.map((entry) => ({
    title: entry.item.name.slice(0, 256),
    quantity: entry.quantity,
    unit_price: entry.item.price
  }));

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
    console.error(TAG, "MP preference error", pref.error);
    await supabase.from("mp_checkout_sessions").update({ status: "failed" }).eq("id", sessionId);
    return NextResponse.json({ error: "No se pudo crear preferencia Mercado Pago", detail: pref.error }, { status: 500 });
  }

  console.info(TAG, "OK sessionId=", sessionId, "preferenceId=", pref.preferenceId);

  return NextResponse.json({
    sessionId,
    preferenceId: pref.preferenceId,
    checkoutUrl: pref.checkoutUrl
  });
}
