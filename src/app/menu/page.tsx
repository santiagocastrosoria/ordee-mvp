import { MenuScreen } from "@/components/screens/menu-screen";
import { menuItems } from "@/lib/menu-data";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export default function MenuPage() {
  // Flat route = demo-ordee fallback. initialItems = hardcoded demo menu so the
  // page still renders if Supabase is unavailable (backward compatible).
  return <MenuScreen restaurantSlug={getDefaultRestaurantSlug()} basePath="" initialItems={menuItems} />;
}
