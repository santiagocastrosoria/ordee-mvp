import { NextRequest, NextResponse } from "next/server";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const restaurantSlug = request.nextUrl.searchParams.get("restaurant") ?? getDefaultRestaurantSlug();
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json([], { status: 200 });
  }

  const ensured = await ensureRestaurantBySlug(supabase, restaurantSlug);
  if (!ensured.ok) {
    console.error("[ORDEE api/tables] ensure restaurant:", ensured.message);
    return NextResponse.json([], { status: 200 });
  }
  const restaurant = { id: ensured.id };

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id,table_number,status,qr_token")
    .eq("restaurant_id", restaurant.id)
    .order("table_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar mesas" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
