import { MenuScreen } from "@/components/screens/menu-screen";

export default function RestaurantMenuPage({ params }: { params: { restaurantSlug: string } }) {
  const slug = decodeURIComponent(params.restaurantSlug).trim();
  // initialItems = [] so we never flash hardcoded demo data for a real tenant.
  return <MenuScreen restaurantSlug={slug} basePath={`/r/${slug}`} initialItems={[]} />;
}
