"use client";

import { formatArs } from "@/lib/format";
import { MenuItem } from "@/lib/types";

interface MenuCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuCard({ item, onAdd }: MenuCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-brand-card">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-40 w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = "/products/pizza.jpg";
          }}
        />
        {item.popular ? <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold text-black">Popular</span> : null}
      </div>
      <div className="p-4">
      <h3 className="text-xl font-semibold">{item.name}</h3>
      <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-brand-gold">{formatArs(item.price)}</span>
        <button
          type="button"
          onClick={() => onAdd(item)}
          className="rounded-lg bg-brand-gold px-3 py-2 text-sm font-semibold text-black hover:brightness-110"
        >
          Agregar
        </button>
      </div>
      </div>
    </article>
  );
}
