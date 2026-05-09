import { NextResponse } from "next/server";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const DEBUG_ENABLED =
  process.env.NODE_ENV === "development" || process.env.ORDER_DEBUG_ROUTE === "1" || process.env.NEXT_PUBLIC_ORDER_DEBUG === "1";

/** POST temporal: crea pedido + 1 línea + pago para verificar inserts y realtime. */
export async function POST() {
  if (!DEBUG_ENABLED) {
    return NextResponse.json({ error: "Ruta debug desactivada en produccion. Set ORDER_DEBUG_ROUTE=1 o NEXT_PUBLIC_ORDER_DEBUG=1." }, { status: 403 });
  }

  const tag = "[ORDEE debug/create-test-order]";
  console.info(tag, "inicio insert manual");

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(tag, "cliente admin:", msg);
    return NextResponse.json({ error: "Env Supabase admin invalido", detail: msg }, { status: 500 });
  }

  const slug = getDefaultRestaurantSlug();
  const ensured = await ensureRestaurantBySlug(supabase, slug);
  if (!ensured.ok) {
    console.error(tag, "ensure restaurant", ensured.message);
    return NextResponse.json({ error: ensured.message, code: ensured.code }, { status: 500 });
  }
  const restaurant = { id: ensured.id };
  console.info(tag, "restaurant_id=", restaurant.id, ensured.created ? "CREADO" : "ya existía");

  const payload = {
    restaurant_id: restaurant.id,
    customer_name: "TEST DEBUG",
    table_number: "99",
    notes: "Pedido creado por /api/debug/create-test-order",
    status: "nuevo" as const,
    payment_status: "pagado" as const,
    payment_method: "transferencia" as const,
    total_ars: 100
  };

  console.info(tag, "insert orders", payload);

  const { data: order, error: orderError } = await supabase.from("orders").insert(payload).select("id").single();

  if (orderError || !order) {
    console.error(tag, "insert orders FALLA", orderError);
    return NextResponse.json(
      {
        error: "insert orders falló",
        step: "orders",
        supabase: orderError ? { message: orderError.message, code: orderError.code, details: orderError.details, hint: orderError.hint } : null
      },
      { status: 500 }
    );
  }

  console.info(tag, "insert ok order id=", order.id);

  const { error: itemsError } = await supabase.from("order_items").insert([
    {
      order_id: order.id,
      menu_item_id: "debug-test",
      item_name: "Producto test",
      quantity: 1,
      unit_price_ars: 100
    }
  ]);

  if (itemsError) {
    console.error(tag, "insert order_items FALLA", itemsError);
    return NextResponse.json(
      {
        error: "insert order_items falló",
        step: "order_items",
        orderId: order.id,
        supabase: { message: itemsError.message, code: itemsError.code, details: itemsError.details, hint: itemsError.hint }
      },
      { status: 500 }
    );
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: order.id,
    provider: "debug",
    status: "approved",
    amount_ars: 100
  });

  if (paymentError) {
    console.error(tag, "insert payments FALLA", paymentError);
    return NextResponse.json(
      {
        error: "insert payments falló",
        step: "payments",
        orderId: order.id,
        supabase: { message: paymentError.message, code: paymentError.code, details: paymentError.details, hint: paymentError.hint }
      },
      { status: 500 }
    );
  }

  console.info(tag, "completo OK", order.id);
  return NextResponse.json({ ok: true, orderId: order.id, slug });
}
