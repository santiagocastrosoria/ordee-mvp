import { CheckoutScreen } from "@/components/screens/checkout-screen";
import { basePathForSlug } from "@/lib/restaurant-routes";

export default function RestaurantCheckoutPage({ params }: { params: { restaurantSlug: string } }) {
  const slug = decodeURIComponent(params.restaurantSlug).trim();
  return <CheckoutScreen restaurantSlug={slug} basePath={basePathForSlug(slug)} />;
}
