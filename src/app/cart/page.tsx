import { CartScreen } from "@/components/screens/cart-screen";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export default function CartPage() {
  return <CartScreen restaurantSlug={getDefaultRestaurantSlug()} basePath="" />;
}
