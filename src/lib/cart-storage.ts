import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { CartItem, MenuItem } from "@/lib/types";

const LEGACY_KEY = "ordee_cart";

function cartKey(restaurantSlug: string): string {
  return `ordee_cart_${restaurantSlug.trim()}`;
}

function migrateLegacyCartIfNeeded(slug: string): void {
  if (typeof window === "undefined") return;
  const targetKey = cartKey(slug);
  if (window.localStorage.getItem(targetKey)) return;

  const legacy = window.localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;

  const demoSlug = getDefaultRestaurantSlug();
  if (slug !== demoSlug) return;

  window.localStorage.setItem(targetKey, legacy);
  window.localStorage.removeItem(LEGACY_KEY);
}

export function getCart(restaurantSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  migrateLegacyCartIfNeeded(restaurantSlug);

  const raw = window.localStorage.getItem(cartKey(restaurantSlug));
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(restaurantSlug: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartKey(restaurantSlug), JSON.stringify(items));
}

export function addToCart(restaurantSlug: string, item: MenuItem): CartItem[] {
  if (item.available === false) {
    return getCart(restaurantSlug);
  }
  const cart = getCart(restaurantSlug);
  const existing = cart.find((entry) => entry.item.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ item, quantity: 1 });
  }

  saveCart(restaurantSlug, cart);
  return cart;
}

export function removeFromCart(restaurantSlug: string, itemId: string): CartItem[] {
  const updated = getCart(restaurantSlug).filter((entry) => entry.item.id !== itemId);
  saveCart(restaurantSlug, updated);
  return updated;
}

export function updateItemQuantity(restaurantSlug: string, itemId: string, quantity: number): CartItem[] {
  const cart = getCart(restaurantSlug);
  const updated = cart
    .map((entry) =>
      entry.item.id === itemId
        ? {
            ...entry,
            quantity
          }
        : entry
    )
    .filter((entry) => entry.quantity > 0);

  saveCart(restaurantSlug, updated);
  return updated;
}

export function clearCart(restaurantSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cartKey(restaurantSlug));
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((acc, entry) => acc + entry.item.price * entry.quantity, 0);
}
