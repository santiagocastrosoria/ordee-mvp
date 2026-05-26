import { NextRequest, NextResponse } from "next/server";
import { fulfillMercadoPagoByPaymentId } from "@/lib/mp-checkout-fulfill";
import { verifyMpWebhookSignature } from "@/lib/mercadopago-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TAG = "[MP webhook]";

/**
 * MercadoPago sends webhooks as:
 *  POST body: { type: "payment", action: "payment.created"|"payment.updated", data: { id: "123" } }
 *  Sometimes also as query param: ?id=123&topic=payment (legacy IPN style)
 *
 * We always respond 200 so MP does not retry endlessly on non-critical events.
 */
export async function POST(request: NextRequest) {
  // --- 1. Parse body (tolerate non-JSON pings) ---
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.warn(TAG, "body no es JSON — ping de MP, respondiendo 200");
    return NextResponse.json({ ok: true, skipped: "non_json_body" });
  }

  const type = body?.type as string | undefined;
  const action = body?.action as string | undefined;
  const dataId = (body?.data as Record<string, unknown> | undefined)?.id;

  // --- 2. Extract payment id: body.data.id OR query param ?id= ---
  const qsId = request.nextUrl.searchParams.get("id");
  const rawId = dataId != null ? String(dataId) : qsId ?? null;

  console.info(TAG, "[mp webhook received]", {
    paymentId: rawId,
    action,
    type,
    ts: new Date().toISOString(),
    url: request.url
  });

  // Non-payment events (e.g. test pings, merchant_order) — ack and skip
  if (type && type !== "payment") {
    console.info(TAG, "evento ignorado tipo=", type);
    return NextResponse.json({ ok: true, skipped: `type_${type}` });
  }

  if (!rawId) {
    console.info(TAG, "sin payment id — respondiendo 200 (ping de MP)");
    return NextResponse.json({ ok: true, skipped: "no_payment_id" });
  }

  // --- 3. Optional HMAC signature check ---
  const configuredSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  if (configuredSecret) {
    const signatureHeader = request.headers.get("x-signature") ?? "";
    const requestId = request.headers.get("x-request-id") ?? "";
    const valid = verifyMpWebhookSignature(signatureHeader, requestId, rawId, configuredSecret);
    if (!valid) {
      console.warn(TAG, "firma HMAC invalida para paymentId=", rawId);
      // Still 200 so MP doesn't retry forever; log for investigation
      return NextResponse.json({ ok: false, skipped: "invalid_signature" });
    }
  }

  // --- 4. Fulfill order ---
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(TAG, "no se pudo crear cliente supabase", msg);
    // Return 200 so MP doesn't retry — we log the issue
    return NextResponse.json({ ok: false, error: msg });
  }

  const result = await fulfillMercadoPagoByPaymentId(supabase, rawId);

  if (result.orderId) {
    console.info(TAG, "[mp webhook approved]", {
      paymentId: rawId,
      orderId: result.orderId,
      ts: new Date().toISOString()
    });
  } else if (!result.ok) {
    console.warn(TAG, "[mp webhook failed]", {
      paymentId: rawId,
      skipped: result.skipped,
      ts: new Date().toISOString()
    });
  } else {
    console.info(TAG, "[webhook session update]", {
      paymentId: rawId,
      skipped: result.skipped
    });
  }

  return NextResponse.json(result);
}

/**
 * MercadoPago also calls GET on the notification URL to validate it exists.
 * Return 200 so the URL is considered valid.
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "ORDEE MP webhook" });
}
