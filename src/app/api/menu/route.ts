import { NextRequest, NextResponse } from "next/server";
import { buildDemoMenuResponse } from "@/lib/menu-api-response";
import { getDefaultRestaurantSlug, getRestaurantBySlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseThemeTokens } from "@/lib/theme";
import type { MenuApiResponse, MenuCategoryMeta, MenuItem } from "@/lib/types";

type MenuRow = {
  id: string;
  name: string;
  description: string | null;
  price_ars: number;
  image_url: string | null;
  is_active?: boolean;
  category_id: string;
  category: { id: string; code: string } | { id: string; code: string }[] | null;
};

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export async function GET(request: NextRequest) {
  const restaurantSlug = request.nextUrl.searchParams.get("restaurant") ?? getDefaultRestaurantSlug();
  const isDefaultDemo = restaurantSlug === getDefaultRestaurantSlug();

  let supabase;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return isDefaultDemo
      ? NextResponse.json(buildDemoMenuResponse(restaurantSlug))
      : NextResponse.json({ error: "Restaurante no disponible" }, { status: 404 });
  }

  const restaurant = await getRestaurantBySlug(supabase, restaurantSlug);
  if (!restaurant) {
    if (isDefaultDemo) {
      return NextResponse.json(buildDemoMenuResponse(restaurantSlug));
    }
    console.warn("[ORDEE api/menu] slug inexistente (sin auto-create):", restaurantSlug);
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });
  }

  const { data: categoryRows, error: catError } = await supabase
    .from("menu_categories")
    .select("id, code, name, sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  if (catError) {
    return isDefaultDemo
      ? NextResponse.json(buildDemoMenuResponse(restaurantSlug))
      : NextResponse.json({ error: "No se pudo cargar el menú" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_ars, image_url, is_active, category_id, category:menu_categories(id, code)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: true });

  if (error) {
    return isDefaultDemo
      ? NextResponse.json(buildDemoMenuResponse(restaurantSlug))
      : NextResponse.json({ error: "No se pudo cargar el menú" }, { status: 500 });
  }

  const categories: MenuCategoryMeta[] = (categoryRows ?? []).map((row: CategoryRow) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    sortOrder: row.sort_order
  }));

  const showProductImages = restaurant.showProductImages ?? true;

  const items: MenuItem[] = ((data ?? []) as unknown as MenuRow[]).map((row) => {
    const cat = Array.isArray(row.category) ? row.category[0] : row.category;
    const categoryCode = cat?.code ?? "principal";
    return {
      id: row.id,
      categoryId: row.category_id ?? cat?.id,
      category: categoryCode,
      name: row.name,
      description: row.description ?? "",
      price: row.price_ars,
      imageUrl: row.image_url,
      available: row.is_active !== false
    };
  });

  if (items.length === 0 && categories.length === 0) {
    return isDefaultDemo
      ? NextResponse.json(buildDemoMenuResponse(restaurantSlug))
      : NextResponse.json({
          restaurant: {
            slug: restaurant.slug,
            name: restaurant.name,
            showProductImages,
            theme: restaurant.theme
          },
          categories: [],
          items: []
        } satisfies MenuApiResponse);
  }

  const response: MenuApiResponse = {
    restaurant: {
      slug: restaurant.slug,
      name: restaurant.name,
      showProductImages,
      theme: restaurant.theme
    },
    categories,
    items
  };

  return NextResponse.json(response);
}
