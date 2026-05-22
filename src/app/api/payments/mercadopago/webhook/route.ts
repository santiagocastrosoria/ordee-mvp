import { NextRequest, NextResponse } from "next/server";
import { fulfillMercadoPagoByPaymentId } from "@/lib/mp-checkout-fulfill";
import { verifyMpWebhookSignature } from "@/lib/mercadopago-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Alias legacy: misma lógica que /api/mercadopago/webhook */
export async function POST(request: NextRequest) {
  const TAG = "[ORDEE api/payments/mercadopago/webhook]";
  const signatureHeader = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const configuredSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  const body = await request.json();

  const paymentId = body?.data?.id ? String(body.data.id) : null;
  if (!paymentId) return NextResponse.json({ ok: true });

  if (configuredSecret) {
    const valid = verifyMpWebhookSignature(signatureHeader, requestId, paymentId, configuredSecret);
    if (!valid) return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await fulfillMercadoPagoByPaymentId(supabase, paymentId);
  console.info(TAG, result);
  return NextResponse.json(result);
}
