import crypto from "node:crypto";
import { requiredEnv } from "@/lib/env";

export function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function parseMpSignature(header: string): { ts?: string; v1?: string } {
  const values: { ts?: string; v1?: string } = {};
  for (const part of header.split(",").map((p) => p.trim())) {
    const [key, value] = part.split("=");
    if (key === "ts") values.ts = value;
    if (key === "v1") values.v1 = value;
  }
  return values;
}

export function verifyMpWebhookSignature(
  signatureHeader: string,
  requestId: string,
  dataId: string,
  secret: string
): boolean {
  const { ts, v1 } = parseMpSignature(signatureHeader);
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const digest = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return timingSafeEqual(digest, v1);
}

export type MpPayment = {
  id?: number;
  status?: string;
  external_reference?: string;
  payment_method_id?: string;
  payment_type_id?: string;
};

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MpPayment | null> {
  const accessToken = requiredEnv("MERCADOPAGO_ACCESS_TOKEN");
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as MpPayment;
}

export async function createCheckoutProPreference(params: {
  sessionId: string;
  items: Array<{ title: string; quantity: number; unit_price: number }>;
  notificationUrl: string;
  backUrls: { success: string; failure: string; pending: string };
}): Promise<{ preferenceId?: string; checkoutUrl?: string; error?: string }> {
  const accessToken = requiredEnv("MERCADOPAGO_ACCESS_TOKEN");

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: params.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS"
      })),
      external_reference: params.sessionId,
      notification_url: params.notificationUrl,
      back_urls: params.backUrls,
      auto_return: "approved",
      // Exclude offline cash payment methods (Rapipago, Pago Fácil, etc.).
      // Restaurant orders must confirm instantly — ticket/offline methods have
      // delayed confirmation and break the realtime kitchen flow.
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }]
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: text };
  }

  const data = (await response.json()) as { id?: string; init_point?: string; sandbox_init_point?: string };
  const isProd = process.env.NODE_ENV === "production";
  const checkoutUrl = isProd ? data.init_point : data.sandbox_init_point ?? data.init_point;

  return {
    preferenceId: data.id,
    checkoutUrl
  };
}
