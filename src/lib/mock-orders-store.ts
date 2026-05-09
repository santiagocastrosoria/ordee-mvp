import { Order, OrderStatus } from "@/lib/types";

declare global {
  var __ordeeOrders__: Order[] | undefined;
}

function getStore(): Order[] {
  if (!globalThis.__ordeeOrders__) {
    globalThis.__ordeeOrders__ = [];
  }
  return globalThis.__ordeeOrders__;
}

export function listOrders(): Order[] {
  return [...getStore()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createOrder(order: Order): Order {
  const store = getStore();
  store.push(order);
  return order;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  const store = getStore();
  const idx = store.findIndex((order) => order.id === id);
  if (idx === -1) return null;

  store[idx] = {
    ...store[idx],
    status
  };

  return store[idx];
}
