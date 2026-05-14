"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MenuCard } from "@/components/menu-card";
import { addToCart, getCart } from "@/lib/cart-storage";
import { categoryLabels, menuItems } from "@/lib/menu-data";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { getSession } from "@/lib/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MenuCategory, MenuItem } from "@/lib/types";

const categories: MenuCategory[] = ["entrada", "principal", "bebida", "postre"];

/** Bajo el header sticky + barra de categorías (ajustar si cambia altura del nav). */
const CATEGORY_SCROLL_ANCHOR_PX = 108;

function MenuContent() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("entrada");
  const [name, setName] = useState("Cliente");
  const [tableNumber, setTableNumber] = useState("1");
  const sectionRefs = useRef<Record<MenuCategory, HTMLElement | null>>({
    entrada: null,
    principal: null,
    bebida: null,
    postre: null
  });

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }

    setName(session.name);
    const fixedTable = session.tableNumber;
    setTableNumber(fixedTable);
    window.localStorage.setItem("ordee_table", fixedTable);

    setCartCount(getCart().reduce((acc, entry) => acc + entry.quantity, 0));

    const slug = encodeURIComponent(getDefaultRestaurantSlug());

    const fetchData = async () => {
      const menuResponse = await fetch(`/api/menu?restaurant=${slug}`, { cache: "no-store" });

      if (menuResponse.ok) {
        const menuData = (await menuResponse.json()) as MenuItem[];
        if (menuData.length > 0) {
          setItems(menuData);
        }
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

  useEffect(() => {
    if (items.length === 0) return;

    const syncActiveFromScroll = () => {
      let next: MenuCategory = "entrada";
      for (const cat of categories) {
        const el = sectionRefs.current[cat];
        if (!el) continue;
        const { top } = el.getBoundingClientRect();
        if (top <= CATEGORY_SCROLL_ANCHOR_PX) next = cat;
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

  const grouped = useMemo(() => {
    return categories.reduce(
      (acc, category) => {
        acc[category] = items.filter((item) => item.category === category);
        return acc;
      },
      {
        entrada: [] as MenuItem[],
        principal: [] as MenuItem[],
        bebida: [] as MenuItem[],
        postre: [] as MenuItem[]
      }
    );
  }, [items]);

  const handleAdd = (item: MenuItem) => {
    const updated = addToCart(item);
    setCartCount(updated.reduce((acc, entry) => acc + entry.quantity, 0));
  };

  const goToCategory = (category: MenuCategory) => {
    setActiveCategory(category);
    sectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="space-y-2.5 pb-8 sm:space-y-3 sm:pb-10">
      <header className="space-y-0.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted sm:text-xs">La parrilla de Don Jose</p>
        <h1 className="text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl md:text-3xl">Bienvenido {name}</h1>
      </header>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-card p-2 shadow-brand-sm sm:p-2.5">
        <p className="text-xs text-brand-muted sm:text-sm">
          Mesa <span className="font-semibold text-brand-ink">{tableNumber}</span>
        </p>
        <Link
          href="/cart"
          className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-brand-border bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-ink shadow-sm transition duration-tap ease-out hover:bg-brand-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 sm:min-h-[36px] sm:px-3 sm:text-sm"
        >
          Ver carrito ({cartCount})
        </Link>
      </div>

      <div className="sticky top-[52px] z-20 -mx-4 border-y border-brand-border bg-brand-bg/95 px-2 py-1 shadow-brand-sm backdrop-blur-md sm:top-[56px] sm:px-3 sm:py-1.5 md:top-[60px]">
        <div className="flex gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => goToCategory(category)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition duration-tap ease-out sm:px-3.5 sm:py-1.5 sm:text-sm ${
                activeCategory === category
                  ? "bg-brand-ink text-brand-accentFg shadow-sm ring-1 ring-brand-ink/10 active:scale-[0.98]"
                  : "border border-transparent bg-brand-soft text-brand-muted hover:bg-brand-border/50 hover:text-brand-ink active:scale-[0.98]"
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>

      {categories.map((category) => (
        <section
          key={category}
          data-category={category}
          ref={(el) => {
            sectionRefs.current[category] = el;
          }}
          className="scroll-mt-24 space-y-1.5 sm:scroll-mt-28 sm:space-y-2"
        >
          <h2 className="text-sm font-semibold tracking-tight text-brand-ink sm:text-base">{categoryLabels[category]}</h2>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-3 lg:grid-cols-4">
            {grouped[category].map((item) => (
              <MenuCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
export default function MenuPage() {
  return (
    <Suspense fallback={<div className="text-sm text-brand-muted">Cargando menú...</div>}>
      <MenuContent />
    </Suspense>
  );
}
