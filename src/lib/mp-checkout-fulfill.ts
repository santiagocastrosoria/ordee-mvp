import type { SupabaseClient } from "@supabase/supabase-js";
import { createOrderInDatabase } from "@/lib/create-order";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago-server";
import { CartItem } from "@/lib/types";

const TAG = "[MP fulfill]";

export async function fulfillMercadoPagoByPaymentId(
  supabase: SupabaseClient,
  mpPaymentId: string
): Promise<{ ok: boolean; orderId?: string; skipped?: string }> {
  // 1. Fetch payment from MP API
  console.info(TAG, "[MP payment approved] consultando pago", mpPaymentId);
  const payment = await fetchMercadoPagoPayment(mpPaymentId);

  if (!payment) {
    console.error(TAG, "no se pudo consultar payment en MP", mpPaymentId);
    return { ok: false, skipped: "fetch_failed" };
  }

  console.info(TAG, "payment status=", payment.status, "ref=", payment.external_reference);

  if (payment.status !== "approved") {
    console.info(TAG, "payment no approved — ignorado", payment.status, mpPaymentId);
    return { ok: true, skipped: `status_${payment.status ?? "unknown"}` };
  }

  const ref = payment.external_reference?.trim();
  if (!ref) {
    console.warn(TAG, "payment approved pero sin external_reference", mpPaymentId);
    return { ok: true, skipped: "no_reference" };
  }

  // 2. Try to find an mp_checkout_session by external_reference (session id)
  const { data: session } = await supabase
    .from("mp_checkout_sessions")
    .select("id, status, order_id, customer_name, table_number, notes, items, total_ars, restaurant_id")
    .eq("id", ref)
    .maybeSingle();

  if (session) {
    // Idempotency: if already completed, return existing order
    if (session.status === "completed" && session.order_id) {
      console.info(TAG, "session ya completada — idempotent", session.order_id);
      return { ok: true, orderId: session.order_id, skipped: "already_completed" };
    }

    console.info(TAG, "[MP payment approved] creando orden desde session", ref);

    const items = session.items as CartItem[];
    const result = await createOrderInDatabase(supabase, {
      customerName: session.customer_name,
      tableNumber: session.table_number ?? undefined,
      notes: session.notes ?? undefined,
      items,
      paymentMethod: "mercado_pago",
      paymentStatus: "pagado",
      mpPaymentId: String(mpPaymentId)
    });

    if (!result.ok) {
      console.error(TAG, "crear orden falló", result);
      await supabase
        .from("mp_checkout_sessions")
        .update({ status: "failed" })
        .eq("id", ref);
      return { ok: false, skipped: result.error };
    }

    await supabase
      .from("mp_checkout_sessions")
      .update({
        status: "completed",
        order_id: result.orderId,
        mp_payment_id: String(mpPaymentId)
      })
      .eq("id", ref);

    console.info(TAG, "[MP order created] orderId=", result.orderId, "sessionId=", ref);
    return { ok: true, orderId: result.orderId };
  }

  // 3. Fallback: ref might be a legacy direct order id
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", ref)
    .maybeSingle();

  if (existingOrder) {
    await supabase
      .from("orders")
      .update({ payment_status: "pagado", status: "preparando" })
      .eq("id", ref);
    await supabase
      .from("payments")
      .update({ status: "approved", provider_payment_id: String(mpPaymentId) })
      .eq("order_id", ref);
    console.info(TAG, "[MP order created] orden legacy actualizada", ref);
    return { ok: true, orderId: ref, skipped: "legacy_order_update" };
  }

  console.warn(TAG, "external_reference no coincide con session ni orden", ref);
  return { ok: true, skipped: "unknown_reference" };
}
