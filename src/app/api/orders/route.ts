import { NextRequest, NextResponse } from "next/server";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
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

function serializeSupabaseErr(err: { message?: string; code?: string; details?: string; hint?: string } | null) {
  if (!err) return null;
  return { message: err.message, code: err.code, details: err.details, hint: err.hint };
}

function totalFromItems(items: CartItem[]): number {
  return items.reduce((acc, entry) => acc + entry.quantity * entry.item.price, 0);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;

  console.info(LOG, "body recibido", {
    restaurantSlugFromClient: body.restaurantSlug,
    restaurantSlugUsado: getDefaultRestaurantSlug(),
    customerNameLen: body.customerName?.trim()?.length ?? 0,
    itemsCount: Array.isArray(body.items) ? body.items.length : "no-array",
    paymentMethod: body.paymentMethod
  });

  if (!body.restaurantSlug || !body.customerName?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
    const detail = !Array.isArray(body.items)
      ? "items no es un array JSON"
      : body.items.length === 0
        ? "carrito vacio(sin lineas)"
        : !body.restaurantSlug
          ? "falta restaurantSlug"
          : "falta customerName";

    console.warn(LOG, "400 validacion:", detail);
    return NextResponse.json({ error: "Datos invalidos", detail }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
    console.info(LOG, "cliente Supabase admin OK");
  } catch (envErr) {
    const msg = envErr instanceof Error ? envErr.message : String(envErr);
    console.error(LOG, "FALLO crear cliente admin:", msg);
    return NextResponse.json({ error: "Config server: falta SUPABASE_SERVICE_ROLE_KEY o URL", detail: msg }, { status: 500 });
  }

  const ensured = await ensureRestaurantBySlug(supabase, getDefaultRestaurantSlug());
  if (!ensured.ok) {
    console.error(LOG, "ensure restaurant falló slug=", getDefaultRestaurantSlug(), ensured.message);
    return NextResponse.json(
      { error: "No se pudo asegurar restaurante", detail: ensured.message, step: "restaurant", code: ensured.code },
      { status: 500 }
    );
  }
  const restaurant = { id: ensured.id };
  console.info(LOG, "restaurant listo restaurant_id=", ensured.id, ensured.created ? "(nuevo)" : "(existente)");

  const total = totalFromItems(body.items);
  const normalizedTable = body.tableNumber?.trim() || null;

  const orderInsert = {
    restaurant_id: restaurant.id,
    customer_name: body.customerName.trim(),
    table_number: normalizedTable,
    notes: body.notes?.trim() || null,
    status: "nuevo" as const,
    payment_status: "pendiente" as const,
    payment_method: body.paymentMethod,
    total_ars: total
  };

  console.info(LOG, "antes insert orders", orderInsert);

  const { data: order, error: orderError } = await supabase.from("orders").insert(orderInsert).select("id").single();

  if (orderError || !order) {
    console.error(LOG, "despues insert orders ERROR", orderError);
    return NextResponse.json(
      { error: "No se pudo crear el pedido", step: "orders", supabase: serializeSupabaseErr(orderError) },
      { status: 500 }
    );
  }

  console.info(LOG, "despues insert orders OK id=", order.id);

  const orderItems = body.items.map((entry) => ({
    order_id: order.id,
    menu_item_id: entry.item.id,
    item_name: entry.item.name,
    quantity: entry.quantity,
    unit_price_ars: entry.item.price
  }));

  console.info(LOG, "antes insert order_items filas=", orderItems.length);

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    console.error(LOG, "order_items ERROR", itemsError);
    return NextResponse.json(
      {
        error: "No se pudo guardar detalle",
        step: "order_items",
        orderId: order.id,
        supabase: serializeSupabaseErr(itemsError)
      },
      { status: 500 }
    );
  }

  console.info(LOG, "order_items OK");

  const provider = body.paymentMethod === "mercado_pago" ? "mercadopago" : "manual";
  console.info(LOG, "antes insert payments provider=", provider, "total=", total);

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      provider,
      status: body.paymentMethod === "mercado_pago" ? "pending" : "approved",
      amount_ars: total
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    console.error(LOG, "payments ERROR", paymentError);
    return NextResponse.json(
      {
        error: "No se pudo registrar pago",
        step: "payments",
        orderId: order.id,
        supabase: serializeSupabaseErr(paymentError)
      },
      { status: 500 }
    );
  }

  console.info(LOG, "payments OK pedido completo paymentId=", payment.id);

  if (body.paymentMethod !== "mercado_pago") {
    await supabase.from("orders").update({ payment_status: "pagado" }).eq("id", order.id);
  }

  if (normalizedTable) {
    await supabase
      .from("restaurant_tables")
      .update({ status: body.paymentMethod === "mercado_pago" ? "esperando_pedido" : "comiendo" })
      .eq("restaurant_id", restaurant.id)
      .eq("table_number", normalizedTable);
  }

  return NextResponse.json({ orderId: order.id, paymentId: payment.id, total });
}
