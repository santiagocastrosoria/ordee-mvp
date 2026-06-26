import { MenuScreen } from "@/components/screens/menu-screen";
import { buildDemoMenuResponse } from "@/lib/menu-api-response";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export default function MenuPage() {
  return (
    <MenuScreen
      restaurantSlug={getDefaultRestaurantSlug()}
      basePath=""
      initialMenu={buildDemoMenuResponse()}
    />
  );
}
