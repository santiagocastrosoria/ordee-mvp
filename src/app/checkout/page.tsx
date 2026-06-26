import { CheckoutScreen } from "@/components/screens/checkout-screen";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export default function CheckoutPage() {
  return <CheckoutScreen restaurantSlug={getDefaultRestaurantSlug()} basePath="" />;
}
