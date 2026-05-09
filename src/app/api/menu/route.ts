import { NextRequest, NextResponse } from "next/server";
import { ensureRestaurantBySlug, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { menuItems } from "@/lib/menu-data";
import { MenuCategory, MenuItem } from "@/lib/types";

type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  price_ars: number;
  image_url: string | null;
  category: {
    code: MenuCategory;
  } | null;
};

export async function GET(request: NextRequest) {
  const restaurantSlug = request.nextUrl.searchParams.get("restaurant") ?? getDefaultRestaurantSlug();
  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(menuItems);
  }

  const ensured = await ensureRestaurantBySlug(supabase, restaurantSlug);
  if (!ensured.ok) {
    console.error("[ORDEE api/menu] ensure restaurant:", ensured.message);
    return NextResponse.json(menuItems);
  }
  const restaurant = { id: ensured.id };
  if (ensured.created) {
    console.info("[ORDEE api/menu] restaurant demo creado restaurant_id=", ensured.id);
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_ars, image_url, category:menu_categories(code)")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(menuItems);
  }

  const response: MenuItem[] = (data as MenuRow[]).map((row) => {
    const category = row.category?.code ?? "principal";
    const fallbackImage = "/products/pizza.jpg";
    return {
      id: row.id,
      category,
      name: row.name,
      description: row.description ?? "",
      price: row.price_ars,
      imageUrl: row.image_url ?? fallbackImage
    };
  });

  if (response.length === 0) {
    return NextResponse.json(menuItems);
  }

  return NextResponse.json(response);
}
