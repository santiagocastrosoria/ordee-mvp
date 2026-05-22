import { NextRequest, NextResponse } from "next/server";
import { createOrderInDatabase } from "@/lib/create-order";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CartItem, PaymentMethod } from "@/lib/types";

const LOG = "[ORDEE api/orders POST]";

interface Body {
  restaurantSlug: string;
  customerName: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;

  console.info(LOG, "body recibido", {
    restaurantSlugFromClient: body.restaurantSlug,
    restaurantSlugUsado: getDefaultRestaurantSlug(),
    itemsCount: Array.isArray(body.items) ? body.items.length : 0,
    paymentMethod: body.paymentMethod
  });

  if (!body.restaurantSlug || !body.customerName?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
    const detail = !Array.isArray(body.items)
      ? "items no es un array JSON"
      : body.items.length === 0
        ? "carrito vacio"
        : !body.restaurantSlug
          ? "falta restaurantSlug"
          : "falta customerName";
    return NextResponse.json({ error: "Datos invalidos", detail }, { status: 400 });
  }

  if (body.paymentMethod === "mercado_pago") {
    return NextResponse.json(
      {
        error: "Use POST /api/mercadopago/create-preference para pagos con Mercado Pago",
        detail: "El pedido se crea solo cuando el pago está approved (webhook)."
      },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (envErr) {
    const msg = envErr instanceof Error ? envErr.message : String(envErr);
    return NextResponse.json({ error: "Config server invalida", detail: msg }, { status: 500 });
  }

  const result = await createOrderInDatabase(supabase, {
    restaurantSlug: body.restaurantSlug,
    customerName: body.customerName,
    tableNumber: body.tableNumber,
    notes: body.notes,
    items: body.items,
    paymentMethod: body.paymentMethod,
    paymentStatus: "pagado"
  });

  if (!result.ok) {
    console.error(LOG, "fallo", result);
    return NextResponse.json({ error: result.error, step: result.step, detail: result.detail }, { status: 500 });
  }

  console.info(LOG, "pedido OK", result.orderId);
  return NextResponse.json({ orderId: result.orderId, paymentId: result.paymentId, total: result.total });
}
