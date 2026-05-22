import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { requiredEnv } from "@/lib/env";

interface Body {
  orderId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;
  const TAG = "[ORDEE api/mercadopago/preference]";
  console.info(TAG, "orderId=", body.orderId, "unitPrice=", body.unitPrice);

  if (!body.orderId || body.unitPrice <= 0 || body.quantity <= 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = requiredEnv("MERCADOPAGO_ACCESS_TOKEN");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(TAG, "falta token", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  const appUrl = getAppBaseUrl();

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: [
        {
          title: body.title,
          quantity: body.quantity,
          unit_price: body.unitPrice,
          currency_id: "ARS"
        }
      ],
      external_reference: body.orderId,
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appUrl}/checkout?status=success&orderId=${body.orderId}`,
        failure: `${appUrl}/checkout?status=failure&orderId=${body.orderId}`,
        pending: `${appUrl}/checkout?status=pending&orderId=${body.orderId}`
      },
      auto_return: "approved"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(TAG, "MP API error HTTP", response.status, errorText.slice(0, 800));
    return NextResponse.json({ error: "No se pudo crear preferencia", detail: errorText }, { status: 500 });
  }

  const data = (await response.json()) as { init_point?: string; sandbox_init_point?: string; id?: string };

  console.info(TAG, "preferencia OK id=", data.id);

  return NextResponse.json({
    preferenceId: data.id,
    checkoutUrl: data.init_point ?? data.sandbox_init_point
  });
}
