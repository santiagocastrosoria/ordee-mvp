"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MenuCard } from "@/components/menu-card";
import { addToCart, getCart } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { customerPaths } from "@/lib/restaurant-routes";
import { requestCustomerHelp } from "@/lib/request-help";
import { getSessionForSlug, sessionLoginPath } from "@/lib/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CartItem, MenuApiResponse, MenuCategoryMeta, MenuItem } from "@/lib/types";

/**
 * Pixel offset from the top of the viewport at which a category section
 * is considered "active" while scrolling. Must be >= sticky header height
 * (nav ~52px + categories bar ~40px ≈ 92px). Using 100px gives a small buffer.
 */
const CATEGORY_SCROLL_ANCHOR_PX = 100;

const EMPTY_MENU: MenuApiResponse = {
  restaurant: { slug: "", name: "", showProductImages: true, theme: null },
  categories: [],
  items: []
};

interface MenuScreenProps {
  /** Active restaurant slug used for the /api/menu fetch. */
  restaurantSlug: string;
  /** Route prefix: "" for flat routes, "/r/<slug>" for scoped routes. */
  basePath: string;
  /** Initial menu payload before the fetch resolves. */
  initialMenu?: MenuApiResponse;
}

export function MenuScreen({ restaurantSlug, basePath, initialMenu }: MenuScreenProps) {
  const router = useRouter();

  const [cartEntries, setCartEntries] = useState<CartItem[]>([]);
  const [menu, setMenu] = useState<MenuApiResponse>(initialMenu ?? EMPTY_MENU);
  const [activeCategory, setActiveCategory] = useState("");
  const [name, setName] = useState("Cliente");
  const [tableNumber, setTableNumber] = useState("1");
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const loginPath = sessionLoginPath(restaurantSlug);
  const paths = customerPaths(restaurantSlug);
  const cartPath = paths.cart;

  const { restaurant, categories, items } = menu;
  const showProductImages = restaurant.showProductImages;

  const visibleCategories = useMemo(() => {
    const codesWithItems = new Set(items.map((item) => item.category));
    return categories.filter((cat) => codesWithItems.has(cat.code));
  }, [categories, items]);

  const cartCount = cartEntries.reduce((acc, e) => acc + e.quantity, 0);
  const cartTotalArs = cartEntries.reduce((acc, e) => acc + e.quantity * e.item.price, 0);

  useEffect(() => {
    if (visibleCategories.length === 0) return;
    setActiveCategory((prev) => {
      if (prev && visibleCategories.some((c) => c.code === prev)) return prev;
      return visibleCategories[0].code;
    });
  }, [visibleCategories]);

  useEffect(() => {
    const session = getSessionForSlug(restaurantSlug);
    if (!session) {
      router.replace(loginPath);
      return;
    }

    setName(session.name);
    setTableNumber(session.tableNumber);

    setCartEntries(getCart(restaurantSlug));

    const slug = encodeURIComponent(restaurantSlug);

    const fetchData = async () => {
      const menuResponse = await fetch(`/api/menu?restaurant=${slug}`, { cache: "no-store" });
      if (menuResponse.ok) {
        const menuData = (await menuResponse.json()) as MenuApiResponse;
        setMenu(menuData);
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
  }, [router, restaurantSlug, loginPath]);

  useEffect(() => {
    if (items.length === 0 || visibleCategories.length === 0) return;

    const syncActiveFromScroll = () => {
      let next = visibleCategories[0].code;
      for (const cat of visibleCategories) {
        const el = sectionRefs.current.get(cat.code);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= CATEGORY_SCROLL_ANCHOR_PX) next = cat.code;
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
  }, [items, visibleCategories]);

  const grouped = useMemo(() => {
    const acc = new Map<string, MenuItem[]>();
    for (const cat of visibleCategories) {
      acc.set(cat.code, items.filter((item) => item.category === cat.code));
    }
    return acc;
  }, [visibleCategories, items]);

  const categoryLabel = (cat: MenuCategoryMeta) => cat.name;

  const handleAdd = (item: MenuItem) => {
    setCartEntries(addToCart(restaurantSlug, item));
  };

  const goToCategory = (code: string) => {
    setActiveCategory(code);
    sectionRefs.current.get(code)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requestHelp = async () => {
    setHelpLoading(true);
    const { ok } = await requestCustomerHelp(restaurantSlug);
    setHelpLoading(false);
    setHelpMessage(ok ? "Aviso enviado" : "Error al enviar");
    window.setTimeout(() => setHelpMessage(""), 2500);
  };

  return (
    <>
      <div
        className={`space-y-2.5 sm:space-y-3 transition-[padding-bottom] duration-300 ${
          cartCount > 0 ? "pb-28 sm:pb-32" : "pb-8 sm:pb-10"
        }`}
      >
        <header className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted sm:text-xs">
              {restaurant.name || "Restaurante"}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl md:text-3xl">
              Bienvenido {name}
            </h1>
          </div>
          <p className="shrink-0 text-xs text-brand-muted sm:text-sm">
            Mesa <span className="font-semibold text-brand-ink">{tableNumber}</span>
          </p>
        </header>

        <div className="sticky top-[45px] z-20 -mx-4 border-b border-brand-border bg-brand-bg px-2 py-1 sm:top-[53px] sm:px-3 sm:py-1.5">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5">
              {visibleCategories.map((category) => (
                <button
                  key={category.code}
                  type="button"
                  onClick={() => goToCategory(category.code)}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ordee-tap sm:px-3.5 sm:py-1.5 sm:text-sm ${
                    activeCategory === category.code
                      ? "bg-brand-accent text-brand-accentFg shadow-sm ring-1 ring-brand-accent/30"
                      : "border border-transparent bg-brand-soft text-brand-muted hover:bg-brand-border/50 hover:text-brand-ink"
                  }`}
                >
                  {categoryLabel(category)}
                </button>
              ))}
            </div>

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

        {visibleCategories.map((category) => (
          <section
            key={category.code}
            data-category={category.code}
            ref={(el) => {
              if (el) sectionRefs.current.set(category.code, el);
              else sectionRefs.current.delete(category.code);
            }}
            className="scroll-mt-24 space-y-1.5 sm:scroll-mt-28 sm:space-y-2"
          >
            <h2 className="text-sm font-semibold tracking-tight text-brand-ink sm:text-base">
              {categoryLabel(category)}
            </h2>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-3 lg:grid-cols-4">
              {(grouped.get(category.code) ?? []).map((item) => (
                <MenuCard key={item.id} item={item} showImages={showProductImages} onAdd={handleAdd} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        aria-hidden={cartCount === 0}
        className={`fixed bottom-0 left-0 right-0 z-40 transition-[transform,opacity] ${
          cartCount > 0
            ? "translate-y-0 opacity-100 duration-300 ease-out"
            : "pointer-events-none translate-y-full opacity-0 duration-200 ease-in"
        }`}
      >
        <div
          className="border-t border-brand-border bg-brand-card shadow-[0_-4px_24px_rgba(0,0,0,0.07)]"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-3">
            <Link
              href={cartPath}
              className="flex items-center justify-between gap-4 ordee-tap-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums text-brand-ink sm:text-base">
                  {formatArs(cartTotalArs)}
                </p>
                <p className="text-[11px] text-brand-muted sm:text-xs">
                  {cartCount} producto{cartCount !== 1 ? "s" : ""}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-brand-accent px-4 py-2 text-xs font-bold text-brand-accentFg shadow-[0_2px_12px_rgba(0,0,0,0.18)] sm:px-5 sm:text-sm">
                Ver carrito →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}