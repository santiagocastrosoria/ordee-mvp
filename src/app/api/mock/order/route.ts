import { NextRequest, NextResponse } from "next/server";
import { createOrder, updateOrderStatus } from "@/lib/mock-orders-store";
import { CartItem, OrderStatus } from "@/lib/types";

interface CreateOrderBody {
  customerName: string;
  tableNumber?: string;
  notes?: string;
  items: CartItem[];
  paymentMethod: "mercado_pago" | "transferencia";
}

interface UpdateOrderBody {
  status: OrderStatus;
}

function totalFromItems(items: CartItem[]): number {
  return items.reduce((acc, entry) => acc + entry.item.price * entry.quantity, 0);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateOrderBody;

  if (!body.customerName?.trim() || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const order = createOrder({
    id: `ord_${Math.random().toString(36).slice(2, 10)}`,
    restaurantId: "resto_demo_1",
    customerName: body.customerName.trim(),
    tableNumber: body.tableNumber?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    items: body.items,
    total: totalFromItems(body.items),
    paymentMethod: body.paymentMethod,
    paymentStatus: "pagado",
    status: "nuevo",
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ id: order.id });
}

export async function PATCH(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("id");
  const body = (await request.json()) as UpdateOrderBody;

  if (!orderId || !body.status) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const updated = updateOrderStatus(orderId, body.status);

  if (!updated) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
