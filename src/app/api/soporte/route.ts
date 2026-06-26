import { NextRequest, NextResponse } from "next/server";
import { getDefaultRestaurantSlug, getRestaurantBySlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface Body {
  tableNumber?: string;
  restaurantSlug?: string;
}

const LOG = "[ORDEE api/soporte POST]";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;
  const slug = (body.restaurantSlug?.trim() || getDefaultRestaurantSlug());
  console.info(LOG, "help_requests insert mesa=", body.tableNumber, "slug=", slug);

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(LOG, "admin client", msg);
    return NextResponse.json({ error: "Env server inválido", detail: msg }, { status: 500 });
  }

  const restaurant = await getRestaurantBySlug(supabase, slug);
  if (!restaurant) {
    console.warn(LOG, "slug inexistente (sin auto-create):", slug);
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }
  console.info(LOG, "restaurant_id=", restaurant.id, "slug=", restaurant.slug);

  const { error } = await supabase.from("help_requests").insert({
    restaurant_id: restaurant.id,
    table_number: body.tableNumber || null,
    status: "nuevo"
  });

  if (error) {
    console.error(LOG, "insert help_requests", error);
    return NextResponse.json(
      { error: "No se pudo registrar solicitud", supabase: { message: error.message, code: error.code, details: error.details } },
      { status: 500 }
    );
  }

  console.info(LOG, "ok restaurant_id=", restaurant.id);
  return NextResponse.json({ ok: true });
}
