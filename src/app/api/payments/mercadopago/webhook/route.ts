import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function parseSignature(header: string): { ts?: string; v1?: string } {
  const parts = header.split(",").map((part) => part.trim());
  const values: { ts?: string; v1?: string } = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "ts") values.ts = value;
    if (key === "v1") values.v1 = value;
  }
  return values;
}

function mapPaymentStatus(status: string | undefined): "pendiente" | "pagado" | "fallido" {
  if (status === "approved") return "pagado";
  if (status === "pending" || status === "in_process") return "pendiente";
  return "fallido";
}

function paymentRowStatus(status: string | undefined): "pending" | "approved" | "rejected" {
  if (status === "approved") return "approved";
  if (status === "pending" || status === "in_process") return "pending";
  return "rejected";
}

export async function POST(request: NextRequest) {
  const TAG = "[ORDEE api/mercadopago/webhook]";
  const signatureHeader = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const configuredSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  const body = await request.json();
  console.info(TAG, "evento recibido", { type: body?.type, action: body?.action, dataId: body?.data?.id });

  // Validacion HMAC estilo Mercado Pago (cuando tengas secret configurado).
  if (configuredSecret) {
    const { ts, v1 } = parseSignature(signatureHeader);
    if (!ts || !v1) {
      console.warn(TAG, "firma invalida: headers incompletos");
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
    }

    const dataId = body?.data?.id ? String(body.data.id) : "";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const digest = crypto.createHmac("sha256", configuredSecret).update(manifest).digest("hex");

    if (!timingSafeEqual(digest, v1)) {
      console.warn(TAG, "firma invalida: digest no coincide");
      return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
    }
  }

  const paymentId = body?.data?.id ? String(body.data.id) : null;
  if (!paymentId) {
    console.info(TAG, "sin paymentId, ignorado");
    return NextResponse.json({ ok: true });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error(TAG, "falta MERCADOPAGO_ACCESS_TOKEN");
    return NextResponse.json({ error: "Falta MERCADOPAGO_ACCESS_TOKEN" }, { status: 500 });
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!paymentResponse.ok) {
    console.error(TAG, "fallo consulta payment", paymentResponse.status);
    return NextResponse.json({ error: "No se pudo consultar payment en Mercado Pago" }, { status: 502 });
  }

  const paymentData = (await paymentResponse.json()) as { status?: string; external_reference?: string };
  const externalReference = paymentData.external_reference ?? null;
  if (!externalReference) {
    console.warn(TAG, "payment sin external_reference", paymentId);
    return NextResponse.json({ ok: true });
  }

  console.info(TAG, "payment consultado", { paymentId, status: paymentData.status, orderId: externalReference });

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("payments")
    .update({
      status: paymentRowStatus(paymentData.status),
      raw_payload: body,
      provider_payment_id: paymentId
    })
    .eq("order_id", externalReference);

  const paymentStatus = mapPaymentStatus(paymentData.status);
  const orderPatch: { payment_status: typeof paymentStatus; status?: "preparando" } = { payment_status: paymentStatus };
  if (paymentStatus === "pagado") {
    orderPatch.status = "preparando";
  }

  await supabase.from("orders").update(orderPatch).eq("id", externalReference);

  return NextResponse.json({ ok: true });
}
