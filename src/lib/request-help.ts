import { getSessionForSlug } from "@/lib/session";

export async function requestCustomerHelp(
  restaurantSlug: string
): Promise<{ ok: boolean; status: number }> {
  const session = getSessionForSlug(restaurantSlug);
  if (!session) {
    return { ok: false, status: 401 };
  }

  const res = await fetch("/api/soporte", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantSlug,
      tableNumber: session.tableNumber
    })
  });

  return { ok: res.ok, status: res.status };
}
