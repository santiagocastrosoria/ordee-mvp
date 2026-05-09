import { NextResponse } from "next/server";
import { listOrders } from "@/lib/mock-orders-store";

export async function GET() {
  return NextResponse.json(listOrders());
}
