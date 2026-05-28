"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MenuCard } from "@/components/menu-card";
import { addToCart, getCart } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { categoryLabels, menuItems } from "@/lib/menu-data";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { getSession } from "@/lib/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CartItem, MenuCategory, MenuItem } from "@/lib/types";

const categories: MenuCategory[] = ["entrada", "principal", "bebida", "postre"];

/**
 * Pixel offset from the top of the viewport at which a category section
 * is considered "active" while scrolling. Must be >= sticky header height
 * (nav ~52px + categories bar ~40px ≈ 92px). Using 100px gives a small buffer.
 */
const CATEGORY_SCROLL_ANCHOR_PX = 100;

function MenuContent() {
  const router = useRouter();

  // Cart — full entry list so we can compute both count AND total.
  const [cartEntries, setCartEntries] = useState<CartItem[]>([]);

  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("entrada");
  const [name, setName] = useState("Cliente");
  const [tableNumber, setTableNumber] = useState("1");

  // "Necesito ayuda" state — lives here since the button moved into the categories row.
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");

  const sectionRefs = useRef<Record<MenuCategory, HTMLElement | null>>({
    entrada: null,
    principal: null,
    bebida: null,
    postre: null
  });

  // Derived cart values.
  const cartCount = cartEntries.reduce((acc, e) => acc + e.quantity, 0);
  const cartTotalArs = cartEntries.reduce((acc, e) => acc + e.quantity * e.item.price, 0);

  // ── Bootstrap: session + initial cart + menu data + realtime ─────────────
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }

    setName(session.name);
    setTableNumber(session.tableNumber);
    window.localStorage.setItem("ordee_table", session.tableNumber);

    setCartEntries(getCart());

    const slug = encodeURIComponent(getDefaultRestaurantSlug());

    const fetchData = async () => {
      const menuResponse = await fetch(`/api/menu?restaurant=${slug}`, { cache: "no-store" });
      if (menuResponse.ok) {
        const menuData = (await menuResponse.json()) as MenuItem[];
        if (menuData.length > 0) setItems(menuData);
      }
    };

    fetchData();

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("ordee-mvp-menu-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // ── Scroll spy: keeps active category tab in sync ─────────────────────────
  useEffect(() => {
    if (items.length === 0) return;

    const syncActiveFromScroll = () => {
      let next: MenuCategory = "entrada";
      for (const cat of categories) {
        const el = sectionRefs.current[cat];
        if (!el) continue;
        if (el.getBoundingClientRect().top <= CATEGORY_SCROLL_ANCHOR_PX) next = cat;
      }
      setActiveCategory((prev) => (prev === next ? prev : next));
    };

    syncActiveFromScroll();
    window.addEventListener("scroll", syncActiveFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveFromScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", syncActiveFromScroll);
      window.removeEventListener("resize", syncActiveFromScroll);
    };
  }, [items]);

  const grouped = useMemo(
    () =>
      categories.reduce(
        (acc, cat) => {
          acc[cat] = items.filter((item) => item.category === cat);
          return acc;
        },
        { entrada: [] as MenuItem[], principal: [] as MenuItem[], bebida: [] as MenuItem[], postre: [] as MenuItem[] }
      ),
    [items]
  );

  const handleAdd = (item: MenuItem) => {
    setCartEntries(addToCart(item));
  };

  const goToCategory = (category: MenuCategory) => {
    setActiveCategory(category);
    sectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requestHelp = async () => {
    setHelpLoading(true);
    const table = window.localStorage.getItem("ordee_table") ?? "sin_mesa";
    const res = await fetch("/api/soporte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber: table })
    });
    setHelpLoading(false);
    setHelpMessage(res.ok ? "Aviso enviado" : "Error al enviar");
    window.setTimeout(() => setHelpMessage(""), 2500);
  };

  return (
    <>
      {/* ── Page content ───────────────────────────────────────────────────── */}
      <div
        className={`space-y-2.5 sm:space-y-3 transition-[padding-bottom] duration-300 ${
          cartCount > 0 ? "pb-28 sm:pb-32" : "pb-8 sm:pb-10"
        }`}
      >
        {/* Welcome header + table number */}
        <header className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted sm:text-xs">Restaurante</p>
            <h1 className="text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl md:text-3xl">
              Bienvenido {name}
            </h1>
          </div>
          <p className="shrink-0 text-xs text-brand-muted sm:text-sm">
            Mesa <span className="font-semibold text-brand-ink">{tableNumber}</span>
          </p>
        </header>

        {/* ── Sticky categories bar + help button ──────────────────────────── */}
        {/*
         * top-[45px]: exact TopNav height at mobile
         *   py-2 (8+8) + nav-links py-1.5/text-xs (6+16+6=28) + border-b (1) = 45px
         * sm:top-[53px]: exact TopNav height at sm+
         *   sm:py-2.5 (10+10) + sm:text-sm/py-1.5 (6+20+6=32) + border-b (1) = 53px
         *
         * bg-brand-bg (fully opaque) so page content never bleeds through,
         * eliminating any transparency-related visual gap.
         */}
        <div className="sticky top-[45px] z-20 -mx-4 border-b border-brand-border bg-brand-bg px-2 py-1 sm:top-[53px] sm:px-3 sm:py-1.5">
          <div className="flex items-center gap-2">
            {/* Scrollable category tabs */}
            <div className="flex flex-1 gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => goToCategory(category)}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ordee-tap sm:px-3.5 sm:py-1.5 sm:text-sm ${
                    activeCategory === category
                      ? "bg-brand-ink text-brand-accentFg shadow-sm ring-1 ring-brand-ink/10"
                      : "border border-transparent bg-brand-soft text-brand-muted hover:bg-brand-border/50 hover:text-brand-ink"
                  }`}
                >
                  {categoryLabels[category]}
                </button>
              ))}
            </div>

            {/* Help button — shrink-0 so it never scrolls with categories */}
            <div className="relative shrink-0 py-0.5">
              <button
                type="button"
                onClick={requestHelp}
                disabled={helpLoading}
                className="whitespace-nowrap rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ordee-tap hover:bg-red-500 disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                {helpLoading ? "Enviando..." : helpMessage || "Necesito ayuda"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Product sections ─────────────────────────────────────────────── */}
        {categories.map((category) => (
          <section
            key={category}
            data-category={category}
            ref={(el) => {
              sectionRefs.current[category] = el;
            }}
            className="scroll-mt-24 space-y-1.5 sm:scroll-mt-28 sm:space-y-2"
          >
            <h2 className="text-sm font-semibold tracking-tight text-brand-ink sm:text-base">
              {categoryLabels[category]}
            </h2>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-3 lg:grid-cols-4">
              {grouped[category].map((item) => (
                <MenuCard key={item.id} item={item} onAdd={handleAdd} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Sticky bottom cart bar ───────────────────────────────────────────
       *
       * Appears with a smooth slide-up + fade when the first item is added.
       * Disappears with a faster slide-down + fade when the cart is emptied.
       *
       * Safe-area: paddingBottom uses CSS max() to respect the iPhone home
       * indicator (env(safe-area-inset-bottom)) with a 12px minimum floor.
       *
       * pointer-events-none when hidden so taps pass through to the page.
       */}
      <div
        aria-hidden={cartCount === 0}
        className={`fixed bottom-0 left-0 right-0 z-40 transition-[transform,opacity] ${
          cartCount > 0
            ? "translate-y-0 opacity-100 duration-300 ease-out"
            : "pointer-events-none translate-y-full opacity-0 duration-200 ease-in"
        }`}
      >
        {/* Solid white background — fully opaque, no blur, no transparency */}
        <div
          className="border-t border-brand-border bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.07)]"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-3">
            <Link
              href="/cart"
              className="flex items-center justify-between gap-4 ordee-tap-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
            >
              {/* Left: price + item count */}
              <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums text-brand-ink sm:text-base">
                  {formatArs(cartTotalArs)}
                </p>
                <p className="text-[11px] text-brand-muted sm:text-xs">
                  {cartCount} producto{cartCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Right: CTA button pill */}
              <span className="shrink-0 rounded-full bg-brand-ink px-4 py-2 text-xs font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] sm:px-5 sm:text-sm">
                Ver carrito →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="text-sm text-brand-muted">Cargando menú...</div>}>
      <MenuContent />
    </Suspense>
  );
}
