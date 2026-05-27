import type { SupabaseClient } from "@supabase/supabase-js";
import { createOrderInDatabase } from "@/lib/create-order";
import { fetchMercadoPagoPayment } from "@/lib/mercadopago-server";
import { CartItem } from "@/lib/types";

const TAG = "[MP fulfill]";

/**
 * Creates the confirmed order for an approved MercadoPago payment.
 *
 * Called by BOTH webhook routes; must be fully idempotent.
 *
 * Duplicate-prevention layers (in order):
 *
 *   Layer 1 — Fast pre-check on payments table
 *     Catches sequential retries (MP sends the same webhook again after 15 s,
 *     30 s, 5 min, …). If provider_payment_id already exists in payments, the
 *     order was already created — return immediately.
 *
 *   Layer 2 — Atomic session claim via conditional UPDATE
 *     UPDATE mp_checkout_sessions SET status = 'processing'
 *     WHERE id = $ref AND status = 'pending'
 *     PostgreSQL serialises concurrent UPDATEs on the same row, so exactly ONE
 *     concurrent call wins (returns the row). All others get null and wait.
 *     This prevents orphan orders from being created at all.
 *
 *   Layer 3 — UNIQUE INDEX backstop + orphan cleanup (create-order.ts)
 *     If somehow two calls both reach createOrderInDatabase (e.g. very fast
 *     Lambda cold-start race), the UNIQUE INDEX on payments.provider_payment_id
 *     rejects the second insert (23505). The loser cleans up its orphan order
 *     and returns the winner's orderId.
 *
 * Cash orders are entirely unaffected: they are created directly from the
 * frontend via /api/orders and never pass through this function.
 */
export async function fulfillMercadoPagoByPaymentId(
  supabase: SupabaseClient,
  mpPaymentId: string
): Promise<{ ok: boolean; orderId?: string; skipped?: string }> {
  // ── 1. Fetch payment from MercadoPago API ────────────────────────────────
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

  // ── Layer 1: fast pre-check — catches sequential retries ─────────────────
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("order_id")
    .eq("provider_payment_id", String(mpPaymentId))
    .maybeSingle();

  if (existingPayment?.order_id) {
    console.info(TAG, "[mp idempotent] payment already processed — returning existing order", {
      mpPaymentId,
      orderId: existingPayment.order_id
    });
    return { ok: true, orderId: existingPayment.order_id as string, skipped: "payment_already_exists" };
  }

  const ref = payment.external_reference?.trim();
  if (!ref) {
    console.warn(TAG, "payment approved pero sin external_reference — paymentId=", mpPaymentId);
    return { ok: true, skipped: "no_reference" };
  }

  // ── 2. Resolve session ────────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("mp_checkout_sessions")
    .select("id, status, order_id, customer_name, table_number, notes, items, total_ars")
    .eq("id", ref)
    .maybeSingle();

  if (sessionError) {
    console.error(TAG, "error al buscar session", ref, sessionError);
  }

  if (session) {
    // Already finished — return existing order (fast path for sequential retries).
    if (session.status === "completed" && session.order_id) {
      console.info(TAG, "[mp idempotent] session ya completada — orderId=", session.order_id);
      return { ok: true, orderId: session.order_id as string, skipped: "already_completed" };
    }

    // Order creation previously failed — do not retry automatically.
    if (session.status === "failed") {
      console.warn(TAG, "session en estado 'failed' — no se reintenta automáticamente", { ref });
      return { ok: true, skipped: "session_failed" };
    }

    // Another concurrent call is already creating the order.
    // Wait briefly for it to finish, then return its result.
    if (session.status === "processing") {
      console.info(TAG, "[mp idempotent] session en 'processing' — esperando call concurrente", { ref });
      await new Promise((r) => setTimeout(r, 4_000));
      const { data: after } = await supabase
        .from("mp_checkout_sessions")
        .select("order_id, status")
        .eq("id", ref)
        .maybeSingle();
      const concurrentOrderId = after?.order_id as string | undefined;
      console.info(TAG, "[mp idempotent] resultado tras espera", { ref, status: after?.status, orderId: concurrentOrderId });
      return { ok: true, orderId: concurrentOrderId, skipped: "concurrent_processing" };
    }

    // ── Layer 2: atomic claim ─────────────────────────────────────────────
    // Update status 'pending' → 'processing' only if still 'pending'.
    // Postgres serialises concurrent UPDATEs on the same row: exactly one call
    // wins (gets the row back); all others get data: null.
    const { data: claimed } = await supabase
      .from("mp_checkout_sessions")
      .update({ status: "processing" })
      .eq("id", ref)
      .eq("status", "pending")
      .select("id, customer_name, table_number, notes, items, total_ars")
      .maybeSingle();

    if (!claimed) {
      // Lost the race — another concurrent call claimed this session.
      // Wait for it to finish and return its result.
      console.info(TAG, "[mp idempotent] atomic claim falló — esperando ganador", { ref });
      await new Promise((r) => setTimeout(r, 4_000));
      const { data: winner } = await supabase
        .from("mp_checkout_sessions")
        .select("order_id, status")
        .eq("id", ref)
        .maybeSingle();
      const winnerOrderId = winner?.order_id as string | undefined;
      console.info(TAG, "[mp idempotent] resultado ganador", { ref, status: winner?.status, orderId: winnerOrderId });
      return { ok: true, orderId: winnerOrderId, skipped: "lost_atomic_claim" };
    }

    // We have exclusive ownership of this session.
    console.info(TAG, "creando orden desde session (exclusive claim)", ref);

    const items = claimed.items as CartItem[];
    const result = await createOrderInDatabase(supabase, {
      customerName: claimed.customer_name as string,
      tableNumber: (claimed.table_number as string | null) ?? undefined,
      notes: (claimed.notes as string | null) ?? undefined,
      items,
      paymentMethod: "mercado_pago",
      paymentStatus: "pagado",
      mpPaymentId: String(mpPaymentId)
    });

    if (!result.ok) {
      console.error(TAG, "createOrderInDatabase falló — marcando session 'failed'", result);
      await supabase.from("mp_checkout_sessions").update({ status: "failed" }).eq("id", ref);
      return { ok: false, skipped: result.error };
    }

    // ── Commit: update session with order_id AND mark completed ───────────
    // Single update so ONE realtime event fires to the frontend with order_id.
    const { error: updateError } = await supabase
      .from("mp_checkout_sessions")
      .update({ status: "completed", order_id: result.orderId })
      .eq("id", ref);

    if (updateError) {
      console.error(TAG, "ERROR al marcar session completed", {
        sessionId: ref,
        orderId: result.orderId,
        error: updateError
      });
    } else {
      console.info(TAG, "[session marked completed]", { sessionId: ref, orderId: result.orderId });
      console.info(TAG, "[realtime update sent]", { sessionId: ref });
    }

    // Optional: persist mp_payment_id (column may not exist in older schemas).
    const { error: mpIdError } = await supabase
      .from("mp_checkout_sessions")
      .update({ mp_payment_id: String(mpPaymentId) })
      .eq("id", ref);
    if (mpIdError) {
      console.warn(TAG, "mp_payment_id no se pudo guardar (columna puede no existir) — ignorado", mpIdError.message);
    }

    if (claimed.notes) {
      console.info(TAG, "[order notes persisted]", { orderId: result.orderId, notes: claimed.notes });
    }

    console.info(TAG, "[MP order created] orderId=", result.orderId, "sessionId=", ref);
    return { ok: true, orderId: result.orderId };
  }

  // ── 3. Fallback: ref may be a legacy order id (old flow, order created first) ──
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", ref)
    .maybeSingle();

  if (existingOrder) {
    // Legacy orders use UPDATE (idempotent — safe to run multiple times).
    if (existingOrder.payment_status === "pagado") {
      console.info(TAG, "[mp idempotent] legacy order ya pagado orderId=", ref);
      return { ok: true, orderId: ref, skipped: "legacy_already_paid" };
    }
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
