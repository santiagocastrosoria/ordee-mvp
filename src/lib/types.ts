export type MenuCategory = "entrada" | "principal" | "bebida" | "postre";

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  emoji?: string;
  popular?: boolean;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type OrderStatus = "nuevo" | "preparando" | "listo" | "entregado" | "cancelado";
export type PaymentMethod = "mercado_pago" | "transferencia" | "naranja_x" | "modo" | "otro";
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
