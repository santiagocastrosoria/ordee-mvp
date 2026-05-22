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
  console.info(TAG, "consultando pago en MP", mpPaymentId);
  const payment = await fetchMercadoPagoPayment(mpPaymentId);

  if (!payment) {
    console.error(TAG, "no se pudo consultar payment en MP", mpPaymentId);
    return { ok: false, skipped: "fetch_failed" };
  }

  console.info(TAG, "payment status=", payment.status, "external_reference=", payment.external_reference);

  if (payment.status !== "approved") {
    console.info(TAG, "payment no aprobado — ignorado status=", payment.status, "paymentId=", mpPaymentId);
    return { ok: true, skipped: `status_${payment.status ?? "unknown"}` };
  }

  console.info(TAG, "[mp webhook approved]", { paymentId: mpPaymentId, status: payment.status });

  const ref = payment.external_reference?.trim();
  if (!ref) {
    console.warn(TAG, "payment approved pero sin external_reference — paymentId=", mpPaymentId);
    return { ok: true, skipped: "no_reference" };
  }

  // 2. Find mp_checkout_session by external_reference (= session UUID)
  const { data: session, error: sessionError } = await supabase
    .from("mp_checkout_sessions")
    .select("id, status, order_id, customer_name, table_number, notes, items, total_ars, restaurant_id")
    .eq("id", ref)
    .maybeSingle();

  if (sessionError) {
    console.error(TAG, "error al buscar session", ref, sessionError);
  }

  if (session) {
    // Idempotency: session already completed — return existing order
    if (session.status === "completed" && session.order_id) {
      console.info(TAG, "session ya completada — idempotent orderId=", session.order_id);
      return { ok: true, orderId: session.order_id as string, skipped: "already_completed" };
    }

    console.info(TAG, "creando orden desde session", ref);

    const items = session.items as CartItem[];
    const result = await createOrderInDatabase(supabase, {
      customerName: session.customer_name as string,
      tableNumber: (session.table_number as string | null) ?? undefined,
      notes: (session.notes as string | null) ?? undefined,
      items,
      paymentMethod: "mercado_pago",
      paymentStatus: "pagado",
      mpPaymentId: String(mpPaymentId)
    });

    if (!result.ok) {
      console.error(TAG, "createOrderInDatabase falló", result);
      // Mark as failed — don't leave in a zombie pending state
      await supabase
        .from("mp_checkout_sessions")
        .update({ status: "failed" })
        .eq("id", ref);
      return { ok: false, skipped: result.error };
    }

    // ── Critical update: status + order_id ────────────────────────────────
    // Split from mp_payment_id update intentionally:
    // If the mp_checkout_sessions table was created without the mp_payment_id column
    // (because "create table if not exists" silently skips ALTER on existing tables),
    // including mp_payment_id here causes the ENTIRE update to fail silently,
    // leaving status = 'pending' even though the order exists.
    const { error: updateError } = await supabase
      .from("mp_checkout_sessions")
      .update({
        status: "completed",
        order_id: result.orderId
      })
      .eq("id", ref);

    if (updateError) {
      console.error(TAG, "ERROR al marcar session completed — status puede quedar 'pending'", {
        sessionId: ref,
        orderId: result.orderId,
        error: updateError
      });
    } else {
      console.info(TAG, "[session marked completed]", { sessionId: ref, orderId: result.orderId });
      console.info(TAG, "[realtime update sent]", { sessionId: ref });
    }

    // ── Optional update: mp_payment_id (safe to fail) ────────────────────
    // mp_payment_id may not exist in older schema versions.
    // The payment ID is already stored in payments.provider_payment_id.
    const { error: mpIdError } = await supabase
      .from("mp_checkout_sessions")
      .update({ mp_payment_id: String(mpPaymentId) })
      .eq("id", ref);

    if (mpIdError) {
      console.warn(TAG, "no se pudo guardar mp_payment_id en session (columna puede no existir) — ignorado", mpIdError.message);
    }

    if (session.notes) {
      console.info(TAG, "[order notes persisted]", { orderId: result.orderId, notes: session.notes });
    }

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
    console.info(TAG, "[MP order created] orden legacy actualizada orderId=", ref);
    return { ok: true, orderId: ref, skipped: "legacy_order_update" };
  }

  console.warn(TAG, "external_reference no coincide con ninguna session ni orden — ref=", ref);
  return { ok: true, skipped: "unknown_reference" };
}
