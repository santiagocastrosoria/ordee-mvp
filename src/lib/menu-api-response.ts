import { categoryLabels, menuItems } from "@/lib/menu-data";
import { DEMO_RESTAURANT_NAME, getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import type { MenuApiResponse, MenuCategoryMeta, MenuItem } from "@/lib/types";

const DEMO_CATEGORY_ORDER = ["entrada", "principal", "bebida", "postre"] as const;

/** Hardcoded fallback when demo-ordee has no DB rows or Supabase is offline. */
export function buildDemoMenuResponse(slug?: string): MenuApiResponse {
  const restaurantSlug = slug ?? getDefaultRestaurantSlug();

  const categories: MenuCategoryMeta[] = DEMO_CATEGORY_ORDER.map((code, i) => ({
    id: `demo-cat-${code}`,
    code,
    name: categoryLabels[code as keyof typeof categoryLabels],
    sortOrder: i + 1
  }));

  const categoryIdByCode = new Map(categories.map((c) => [c.code, c.id]));

  const items: MenuItem[] = menuItems.map((item) => ({
    id: item.id,
    categoryId: categoryIdByCode.get(item.category) ?? `demo-cat-${item.category}`,
    category: item.category,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    popular: item.popular,
    available: item.available !== false
  }));

  return {
    restaurant: {
      slug: restaurantSlug,
      name: DEMO_RESTAURANT_NAME,
      showProductImages: true,
      theme: null
    },
    categories,
    items
  };
}

/** Detect legacy flat MenuItem[] responses (pre-SaaS API). */
export function isLegacyMenuPayload(data: unknown): data is MenuItem[] {
  return Array.isArray(data) && (data.length === 0 || ("category" in data[0] && !("restaurant" in data)));
}
