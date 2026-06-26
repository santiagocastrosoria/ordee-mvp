import { LoginScreen } from "@/components/screens/login-screen";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export default function LoginPage() {
  return <LoginScreen basePath="" restaurantSlug={getDefaultRestaurantSlug()} />;
}
