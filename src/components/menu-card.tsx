"use client";

import { formatArs } from "@/lib/format";
import { resolveProductImage } from "@/lib/product-image";
import { MenuItem } from "@/lib/types";

interface MenuCardProps {
  item: MenuItem;
  showImages: boolean;
  onAdd: (item: MenuItem) => void;
}

function displayDescription(description: string): string {
  return description.replace(/^\[[^\]]+\]\s*/, "");
}

export function MenuCard({ item, showImages, onAdd }: MenuCardProps) {
  const src = resolveProductImage(item, showImages);
  const soldOut = item.available === false;
  const description = displayDescription(item.description);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-lg border border-brand-border bg-brand-card shadow-brand-sm transition-shadow duration-tap ease-out ${
        soldOut ? "opacity-60" : "hover:shadow-md"
      }`}
    >
      {src ? (
        <div className="relative h-[48px] w-full shrink-0 overflow-hidden bg-brand-soft sm:h-[54px] md:h-[60px]">
          <img
            src={src}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}
      <div className={`flex min-h-0 flex-1 flex-col px-1.5 pb-1.5 sm:px-2 sm:pb-1.5 ${src ? "pt-1 sm:pt-1.5" : "pt-2 sm:pt-2.5"}`}>
        {soldOut ? (
          <span className="mb-0.5 inline-flex w-fit rounded-full border border-brand-border bg-brand-ink px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-accentFg">
            Agotado
          </span>
        ) : item.popular ? (
          <span className="mb-0.5 inline-flex w-fit rounded-full border border-brand-border bg-brand-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-ink">
            Popular
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-[11px] font-semibold leading-tight tracking-tight text-brand-ink sm:text-xs">{item.name}</h3>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-brand-muted sm:text-[11px]">{description}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-1 pt-1">
          <span className="min-w-0 shrink text-[11px] font-semibold tabular-nums text-brand-ink sm:text-xs">{formatArs(item.price)}</span>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => !soldOut && onAdd(item)}
            className="inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-brand-accent px-2 text-[10px] font-semibold text-brand-accentFg shadow-sm ordee-tap-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-1 focus-visible:ring-offset-brand-card disabled:cursor-not-allowed disabled:opacity-40 sm:h-7 sm:px-2.5 sm:text-[11px]"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
