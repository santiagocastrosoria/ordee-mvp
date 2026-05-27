import { NextRequest, NextResponse } from "next/server";
import { fulfillMercadoPagoByPaymentId } from "@/lib/mp-checkout-fulfill";
import { verifyMpWebhookSignature } from "@/lib/mercadopago-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Legacy webhook alias — same logic as /api/mercadopago/webhook.
 *
 * Both routes share fulfillMercadoPagoByPaymentId which is fully idempotent:
 * even if MercadoPago somehow calls both URLs for the same payment, the atomic
 * session claim (Layer 2) and UNIQUE INDEX on payments (Layer 3) guarantee
 * exactly one order is ever created.
 */
export async function POST(request: NextRequest) {
  const TAG = "[MP webhook legacy]";

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: true, skipped: "non_json_body" });
  }

  const dataId = (body?.data as Record<string, unknown> | undefined)?.id;
  const qsId = request.nextUrl.searchParams.get("id");
  const rawId = dataId != null ? String(dataId) : qsId ?? null;

  if (!rawId) {
    return NextResponse.json({ ok: true, skipped: "no_payment_id" });
  }

  console.info(TAG, "[mp webhook received]", { paymentId: rawId, ts: new Date().toISOString() });

  const configuredSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  if (configuredSecret) {
    const signatureHeader = request.headers.get("x-signature") ?? "";
    const requestId = request.headers.get("x-request-id") ?? "";
    const valid = verifyMpWebhookSignature(signatureHeader, requestId, rawId, configuredSecret);
    if (!valid) {
      console.warn(TAG, "firma HMAC invalida para paymentId=", rawId);
      return NextResponse.json({ ok: false, skipped: "invalid_signature" });
    }
  }

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(TAG, "no se pudo crear cliente supabase", msg);
    return NextResponse.json({ ok: false, error: msg });
  }

  const result = await fulfillMercadoPagoByPaymentId(supabase, rawId);
  console.info(TAG, "fulfill result", result);
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "ORDEE MP webhook (legacy alias)" });
}
