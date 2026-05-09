import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PaymentMethod } from "@/lib/types";

interface Body {
  orderId: string;
  paymentMethod: PaymentMethod;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;
  if (!body.orderId || !body.paymentMethod) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  await supabase
    .from("payments")
    .update({
      status: "approved",
      provider: body.paymentMethod,
      provider_payment_id: `${body.paymentMethod}-${Date.now()}`
    })
    .eq("order_id", body.orderId);

  await supabase.from("orders").update({ payment_status: "pagado", payment_method: body.paymentMethod }).eq("id", body.orderId);

  return NextResponse.json({ ok: true });
}
