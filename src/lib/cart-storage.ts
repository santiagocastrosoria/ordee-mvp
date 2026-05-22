import { CartItem, MenuItem } from "@/lib/types";

const KEY = "ordee_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(item: MenuItem): CartItem[] {
  if (item.available === false) {
    return getCart();
  }
  const cart = getCart();
  const existing = cart.find((entry) => entry.item.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ item, quantity: 1 });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId: string): CartItem[] {
  const updated = getCart().filter((entry) => entry.item.id !== itemId);
  saveCart(updated);
  return updated;
}

export function updateItemQuantity(itemId: string, quantity: number): CartItem[] {
  const cart = getCart();
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

  saveCart(updated);
  return updated;
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((acc, entry) => acc + entry.item.price * entry.quantity, 0);
}
