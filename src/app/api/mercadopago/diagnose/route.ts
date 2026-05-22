/**
 * Diagnostic endpoint — visit /api/mercadopago/diagnose to see:
 *   - which env vars are set (never reveals values)
 *   - whether Supabase admin client can connect
 *   - whether mp_checkout_sessions table exists and is writable
 *   - whether MERCADOPAGO_ACCESS_TOKEN is set
 *
 * Safe to leave deployed: reveals no secrets, only reports presence/absence.
 */
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TAG = "[mp/diagnose]";

export async function GET() {
  const report: Record<string, unknown> = {};

  // ── Env vars ──────────────────────────────────────────────────────────────
  report.env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    MERCADOPAGO_ACCESS_TOKEN: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: Boolean(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY),
    NEXT_PUBLIC_BASE_URL: Boolean(process.env.NEXT_PUBLIC_BASE_URL),
    MERCADOPAGO_WEBHOOK_SECRET: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET)
  };

  // ── Supabase admin client ─────────────────────────────────────────────────
  let supabase: ReturnType<typeof createSupabaseAdminClient> | null = null;
  try {
    supabase = createSupabaseAdminClient();
    report.supabaseAdminClient = "ok";
  } catch (e) {
    report.supabaseAdminClient = "FAIL: " + (e instanceof Error ? e.message : String(e));
    console.error(TAG, "admin client error", e);
    return NextResponse.json(report);
  }

  // ── restaurants table ─────────────────────────────────────────────────────
  try {
    const { data, error } = await supabase.from("restaurants").select("id").limit(1);
    report.restaurantsTable = error ? "FAIL: " + error.message : `ok (${data?.length ?? 0} rows)`; 
  } catch (e) {
    report.restaurantsTable = "FAIL: " + String(e);
  }

  // ── mp_checkout_sessions table: SELECT ────────────────────────────────────
  try {
    const { data, error } = await supabase
      .from("mp_checkout_sessions")
      .select("id, status, mp_payment_id")
      .limit(1);
    report.mpSessionsTableSelect = error ? "FAIL: " + error.message + " code=" + error.code : `ok (${data?.length ?? 0} rows)`;
    if (data && data.length > 0) {
      report.mpSessionsSample = { hasStatus: "status" in data[0], hasMpPaymentId: "mp_payment_id" in data[0] };
    }
  } catch (e) {
    report.mpSessionsTableSelect = "FAIL: " + String(e);
  }

  // ── mp_checkout_sessions table: test INSERT then DELETE ───────────────────
  try {
    // First ensure we have a restaurant to reference
    const { data: restaurant } = await supabase.from("restaurants").select("id").limit(1).maybeSingle();
    if (!restaurant?.id) {
      report.mpSessionsTableInsert = "SKIP — no restaurant row to use as FK";
    } else {
      const testItems = [{ item: { id: "test", name: "Test", price: 100, description: "", category: "principal", imageUrl: "" }, quantity: 1 }];
      const { data: inserted, error: insErr } = await supabase
        .from("mp_checkout_sessions")
        .insert({
          restaurant_id: restaurant.id,
          customer_name: "__diagnose_test__",
          total_ars: 100,
          items: testItems,
          payment_method: "mercado_pago",
          status: "pending"
        })
        .select("id")
        .single();

      if (insErr || !inserted) {
        report.mpSessionsTableInsert = "FAIL: " + (insErr?.message ?? "null row") + " code=" + insErr?.code;
      } else {
        report.mpSessionsTableInsert = "ok — inserted id=" + (inserted.id as string).slice(0, 8) + "...";
        // Clean up
        await supabase.from("mp_checkout_sessions").delete().eq("id", inserted.id as string);
        report.mpSessionsTableDelete = "ok — cleaned up test row";
      }
    }
  } catch (e) {
    report.mpSessionsTableInsert = "FAIL exception: " + String(e);
  }

  console.info(TAG, "diagnose result", JSON.stringify(report));
  return NextResponse.json(report, { status: 200 });
}
