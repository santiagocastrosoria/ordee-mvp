"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartTotal, getCart, updateItemQuantity } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { getSession } from "@/lib/session";
import { CartItem } from "@/lib/types";

const qtyBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white text-base font-medium text-brand-ink shadow-sm transition duration-tap ease-out hover:bg-brand-soft hover:border-brand-muted/30 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink/20 disabled:pointer-events-none disabled:opacity-40";

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
    <section className="space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">Tu pedido</h1>
        <p className="mt-1 text-sm text-brand-muted">Revisa cantidades y total antes de pagar.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-brand-card p-6 shadow-brand-sm">
          <p className="text-sm text-brand-muted">No hay productos en el carrito.</p>
          <Link
            href="/menu"
            className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
          >
            Ir al menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-2 sm:space-y-2.5">
            {items.map((entry) => (
              <li
                key={entry.item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-card p-3 shadow-brand-sm sm:p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-brand-ink">{entry.item.name}</p>
                  <p className="text-sm text-brand-muted">{formatArs(entry.item.price)} c/u</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => changeQty(entry.item.id, entry.quantity - 1)} className={qtyBtn} disabled={entry.quantity <= 1}>
                    -
                  </button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums text-brand-ink">{entry.quantity}</span>
                  <button type="button" onClick={() => changeQty(entry.item.id, entry.quantity + 1)} className={qtyBtn}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-brand-border bg-brand-card p-4 shadow-brand-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Total</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-brand-ink sm:text-3xl">{formatArs(total)}</p>
            <Link
              href="/checkout"
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 sm:w-auto"
            >
              Continuar al pago
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
