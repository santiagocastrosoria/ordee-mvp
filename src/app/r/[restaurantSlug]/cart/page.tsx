import { CartScreen } from "@/components/screens/cart-screen";
import { basePathForSlug } from "@/lib/restaurant-routes";

export default function RestaurantCartPage({ params }: { params: { restaurantSlug: string } }) {
  const slug = decodeURIComponent(params.restaurantSlug).trim();
  return <CartScreen restaurantSlug={slug} basePath={basePathForSlug(slug)} />;
}
