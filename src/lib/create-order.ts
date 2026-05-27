import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { CartItem, PaymentMethod } from "@/lib/types";

export type CreateOrderInput = {
  restaurantSlug?: string;
  customerName: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  /** Pago ya aprobado (Mercado Pago webhook o efectivo). */
  paymentStatus: "pagado" | "pendiente";
  mpPaymentId?: string;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; paymentId: string; total: number }
  | { ok: false; error: string; step?: string; detail?: unknown };

function totalFromItems(items: CartItem[]): number {
  return items.reduce((acc, entry) => acc + entry.quantity * entry.item.price, 0);
}

export async function createOrderInDatabase(
  supabase: SupabaseClient,
  body: CreateOrderInput
): Promise<CreateOrderResult> {
  const slug = body.restaurantSlug ?? getDefaultRestaurantSlug();
  const ensured = await ensureRestaurantBySlug(supabase, slug);
  if (!ensured.ok) {
    return { ok: false, error: ensured.message, step: "restaurant" };
  }

  const total = totalFromItems(body.items);
  const normalizedTable = body.tableNumber?.trim() || null;
  const paid = body.paymentStatus === "pagado";

  const orderInsert = {
    restaurant_id: ensured.id,
    customer_name: body.customerName.trim(),
    table_number: normalizedTable,
    notes: body.notes?.trim() || null,
    status: paid ? ("preparando" as const) : ("nuevo" as const),
    payment_status: body.paymentStatus,
    payment_method: body.paymentMethod,
    total_ars: total
  };

  const { data: order, error: orderError } = await supabase.from("orders").insert(orderInsert).select("id").single();

  if (orderError || !order) {
    return { ok: false, error: "No se pudo crear el pedido", step: "orders", detail: orderError };
  }

  const orderItems = body.items.map((entry) => ({
    order_id: order.id,
    menu_item_id: entry.item.id,
    item_name: entry.item.name,
    quantity: entry.quantity,
    unit_price_ars: entry.item.price
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return { ok: false, error: "No se pudo guardar detalle", step: "order_items", detail: itemsError };
  }

  const provider = body.paymentMethod === "mercado_pago" ? "mercadopago" : "manual";
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: order.id,
      provider,
      status: paid ? "approved" : "pending",
      amount_ars: total,
      provider_payment_id: body.mpPaymentId ?? null
    })
    .select("id")
    .single();

  if (paymentError) {
    // ── Layer 2: handle race-condition duplicate (23505 unique violation) ───
    // Two concurrent webhook calls both passed the pre-check, both created an
    // order row, but only one can win the UNIQUE INDEX on provider_payment_id.
    // The loser arrives here: clean up the orphan order we just inserted and
    // return the winner's order so the caller stays idempotent.
    if (paymentError.code === "23505" && body.mpPaymentId) {
      console.warn(
        "[create-order] 23505 on payment insert — race condition duplicate detected, cleaning orphan",
        { orphanOrderId: order.id, mpPaymentId: body.mpPaymentId }
      );
      // Remove orphan order (cascades to order_items via FK).
      await supabase.from("orders").delete().eq("id", order.id);
      // Return the winner's order ID.
      const { data: winner } = await supabase
        .from("payments")
        .select("order_id")
        .eq("provider_payment_id", body.mpPaymentId)
        .maybeSingle();
      const winnerId = winner?.order_id as string | undefined;
      if (winnerId) {
        return { ok: true, orderId: winnerId, paymentId: "", total };
      }
    }
    return { ok: false, error: "No se pudo registrar pago", step: "payments", detail: paymentError };
  }

  if (!payment) {
    return { ok: false, error: "No se pudo registrar pago", step: "payments", detail: null };
  }

  if (normalizedTable && paid) {
    await supabase
      .from("restaurant_tables")
      .update({ status: "comiendo" })
      .eq("restaurant_id", ensured.id)
      .eq("table_number", normalizedTable);
  }

  return { ok: true, orderId: order.id, paymentId: payment.id, total };
}
