"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartTotal, getCart, updateItemQuantity } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { getSession } from "@/lib/session";
import { CartItem } from "@/lib/types";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setItems(getCart());
  }, [router]);

  const changeQty = (id: string, next: number) => {
    setItems(updateItemQuantity(id, next));
  };

  const total = cartTotal(items);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-gold">Tu pedido</h1>
        <p className="text-zinc-400">Revisa cantidades y total antes de pagar.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-brand-card p-6">
          <p className="text-zinc-300">No hay productos en el carrito.</p>
          <Link href="/menu" className="mt-4 inline-block rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-black">
            Ir al menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((entry) => (
              <li key={entry.item.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-brand-card p-4">
                <div>
                  <p className="text-lg font-semibold">{entry.item.name}</p>
                  <p className="text-sm text-zinc-400">{formatArs(entry.item.price)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQty(entry.item.id, entry.quantity - 1)}
                    className="h-8 w-8 rounded bg-zinc-800"
                  >
                    -
                  </button>
                  <span className="w-6 text-center">{entry.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(entry.item.id, entry.quantity + 1)}
                    className="h-8 w-8 rounded bg-zinc-800"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-zinc-800 bg-brand-card p-4">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-3xl font-bold text-brand-gold">{formatArs(total)}</p>
            <Link href="/checkout" className="mt-4 inline-block rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-black">
              Continuar al pago
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
