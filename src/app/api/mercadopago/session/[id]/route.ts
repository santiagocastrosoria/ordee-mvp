import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("mp_checkout_sessions")
    .select("id, status, order_id, total_ars, mp_payment_id")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Sesion no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: data.id,
    status: data.status,
    orderId: data.order_id,
    total: data.total_ars,
    mpPaymentId: data.mp_payment_id
  });
}
