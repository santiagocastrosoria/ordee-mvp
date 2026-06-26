import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

const SCOPED_PREFIX = /^\/r\/([^/]+)/;

/** Extract restaurant slug from a pathname, or null if not under /r/[slug]. */
export function parseRestaurantSlugFromPath(pathname: string): string | null {
  const match = pathname.match(SCOPED_PREFIX);
  if (!match?.[1]) return null;
  return decodeURIComponent(match[1]).trim() || null;
}

/** Route prefix for a restaurant: "" for flat demo, "/r/clarkes" for scoped. */
export function basePathForSlug(slug: string): string {
  const clean = slug.trim();
  if (!clean || clean === getDefaultRestaurantSlug()) {
    return "";
  }
  return `/r/${encodeURIComponent(clean)}`;
}

export function customerPaths(slug: string) {
  const base = basePathForSlug(slug);
  return {
    login: base || "/",
    menu: `${base}/menu`,
    cart: `${base}/cart`,
    checkout: `${base}/checkout`
  };
}

/** True when pathname is a login landing (flat / or /r/[slug] with no sub-route). */
export function isCustomerLoginPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const slug = parseRestaurantSlugFromPath(pathname);
  if (!slug) return false;
  return pathname === `/r/${encodeURIComponent(slug)}` || pathname === `/r/${slug}`;
}
