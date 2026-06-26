import { LoginScreen } from "@/components/screens/login-screen";
import { displayNameForRestaurantSlug } from "@/lib/restaurant-demo";

export default function RestaurantLandingPage({ params }: { params: { restaurantSlug: string } }) {
  const slug = decodeURIComponent(params.restaurantSlug).trim();
  return <LoginScreen basePath={`/r/${slug}`} restaurantName={displayNameForRestaurantSlug(slug)} />;
}
