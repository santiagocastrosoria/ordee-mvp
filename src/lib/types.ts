import type { ThemeTokens } from "@/lib/theme";

/** Category code slug (was fixed union; now dynamic per restaurant). */
export type MenuCategory = string;

export interface MenuCategoryMeta {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface RestaurantMenuConfig {
  slug: string;
  name: string;
  showProductImages: boolean;
  theme: ThemeTokens | null;
}

export interface MenuItem {
  id: string;
  /** Stable category slug for grouping and cart compat. */
  category: MenuCategory;
  categoryId?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  emoji?: string;
  popular?: boolean;
  /** false = agotado (is_active en DB); por defecto disponible */
  available?: boolean;
}

export interface MenuApiResponse {
  restaurant: RestaurantMenuConfig;
  categories: MenuCategoryMeta[];
  items: MenuItem[];
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type OrderStatus = "nuevo" | "preparando" | "listo" | "entregado" | "cancelado";
export type PaymentMethod = "mercado_pago" | "transferencia" | "naranja_x" | "modo" | "otro" | "efectivo";
export type PaymentStatus = "pendiente" | "pagado" | "fallido";

export interface Order {
  id: string;
  restaurantId: string;
  customerName: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
}
