import { notFound } from "next/navigation";
import { RestaurantThemeProvider } from "@/components/restaurant-theme-provider";
import { getDefaultRestaurantSlug, getRestaurantBySlug } from "@/lib/restaurant-demo";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ThemeTokens } from "@/lib/theme";

/**
 * Server-side guard for every /r/[restaurantSlug]/* page.
 *
 * Resolves the slug READ-ONLY (never auto-creates). If the restaurant does not
 * exist, calls notFound() which renders ./not-found.tsx. No DB row, session,
 * cart, or order is ever created for an unknown slug.
 *
 * The default demo slug is always allowed (parity with the flat /menu fallback)
 * so demo-ordee keeps working even on a fresh database or when Supabase env is
 * not configured locally.
 */
export default async function RestaurantScopeLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { restaurantSlug: string };
}) {
  const slug = decodeURIComponent(params.restaurantSlug).trim();
  const isDefaultDemo = slug === getDefaultRestaurantSlug();

  let allowed = isDefaultDemo;
  let theme: ThemeTokens | null = null;

  try {
    const supabase = createSupabaseAdminClient();
    const restaurant = await getRestaurantBySlug(supabase, slug);
    if (restaurant) {
      allowed = true;
      theme = restaurant.theme;
    }
  } catch (e) {
    console.error("[ORDEE /r layout] no se pudo validar slug=", slug, e instanceof Error ? e.message : e);
    allowed = isDefaultDemo;
  }

  if (!allowed) {
    notFound();
  }

  return (
    <RestaurantThemeProvider slug={slug} theme={theme}>
      {children}
    </RestaurantThemeProvider>
  );
}
