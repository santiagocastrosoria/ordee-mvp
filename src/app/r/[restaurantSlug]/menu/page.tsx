import { MenuScreen } from "@/components/screens/menu-screen";

export default function RestaurantMenuPage({ params }: { params: { restaurantSlug: string } }) {
  const slug = decodeURIComponent(params.restaurantSlug).trim();
  return <MenuScreen restaurantSlug={slug} basePath={`/r/${slug}`} />;
}
