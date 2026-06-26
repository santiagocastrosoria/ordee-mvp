import { NextRequest, NextResponse } from "next/server";
import { getDefaultRestaurantSlug, getRestaurantBySlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { menuItems } from "@/lib/menu-data";
import { MenuCategory, MenuItem } from "@/lib/types";

type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  price_ars: number;
  image_url: string | null;
  is_active?: boolean;
  category: {
    code: MenuCategory;
  } | null;
};

export async function GET(request: NextRequest) {
  const restaurantSlug = request.nextUrl.searchParams.get("restaurant") ?? getDefaultRestaurantSlug();
  // Hardcoded demo fallback is allowed ONLY for the default demo slug.
  // For any other (real) tenant we never serve demo data.
  const isDefaultDemo = restaurantSlug === getDefaultRestaurantSlug();

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return isDefaultDemo
      ? NextResponse.json(menuItems)
      : NextResponse.json({ error: "Restaurante no disponible" }, { status: 404 });
  }

  // READ-ONLY resolution — never auto-creates a restaurant for a public request.
  const restaurant = await getRestaurantBySlug(supabase, restaurantSlug);
  if (!restaurant) {
    if (isDefaultDemo) {
      // Demo not seeded yet — keep backward-compatible demo menu.
      return NextResponse.json(menuItems);
    }
    console.warn("[ORDEE api/menu] slug inexistente (sin auto-create):", restaurantSlug);
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_ars, image_url, is_active, category:menu_categories(code)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true });

  if (error) {
    return isDefaultDemo
      ? NextResponse.json(menuItems)
      : NextResponse.json({ error: "No se pudo cargar el menú" }, { status: 500 });
  }

  const response: MenuItem[] = ((data ?? []) as unknown as MenuRow[]).map((row) => {
    const category = Array.isArray(row.category)
  ? row.category[0]?.code ?? "principal"
  : row.category?.code ?? "principal";
    const fallbackImage = "/products/pizza.jpg";
    return {
      id: row.id,
      category,
      name: row.name,
      description: row.description ?? "",
      price: row.price_ars,
      imageUrl: row.image_url ?? fallbackImage,
      available: row.is_active !== false
    };
  });

  if (response.length === 0) {
    // Only the demo falls back to hardcoded items; a real tenant with an empty
    // menu legitimately returns an empty list (no demo data leak).
    return isDefaultDemo ? NextResponse.json(menuItems) : NextResponse.json([]);
  }

  return NextResponse.json(response);
}
