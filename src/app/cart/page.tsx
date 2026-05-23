"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartTotal, getCart, removeFromCart, updateItemQuantity } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { getSession } from "@/lib/session";
import { CartItem } from "@/lib/types";

const qtyBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white text-base font-medium text-brand-ink shadow-sm ordee-tap-sm hover:bg-brand-soft hover:border-brand-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink/20 disabled:pointer-events-none disabled:opacity-40";

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

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

  const removeLine = (id: string) => {
    setItems(removeFromCart(id));
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
            className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-accentFg shadow-sm ordee-tap hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
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
                className="flex items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-card p-3 shadow-brand-sm transition-opacity duration-tap ease-out sm:gap-3 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-brand-ink">{entry.item.name}</p>
                  <p className="text-sm text-brand-muted">{formatArs(entry.item.price)} c/u</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => removeLine(entry.item.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-muted shadow-sm ordee-tap-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/50"
                    aria-label={`Eliminar ${entry.item.name}`}
                  >
                    <TrashIcon />
                  </button>
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
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm ordee-tap-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 sm:w-auto"
            >
              Continuar al pago
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
