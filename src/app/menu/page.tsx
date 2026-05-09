"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MenuCard } from "@/components/menu-card";
import { addToCart, getCart } from "@/lib/cart-storage";
import { categoryLabels, menuItems } from "@/lib/menu-data";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { getSession } from "@/lib/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MenuCategory, MenuItem } from "@/lib/types";

const categories: MenuCategory[] = ["entrada", "principal", "bebida", "postre"];

type TableRow = {
  id: string;
  table_number: string;
  status: string;
  qr_token: string;
};

export default function MenuPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesaParam = searchParams.get("mesa");
  const [cartCount, setCartCount] = useState(0);
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [tables, setTables] = useState<TableRow[]>([]);
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
    if (mesaParam) {
      window.localStorage.setItem("ordee_table", mesaParam);
    }

    const savedTable = window.localStorage.getItem("ordee_table") ?? mesaParam ?? "1";
    setTableNumber(savedTable);

    setCartCount(getCart().reduce((acc, entry) => acc + entry.quantity, 0));

    const slug = encodeURIComponent(getDefaultRestaurantSlug());

    const fetchData = async () => {
      const [menuResponse, tableResponse] = await Promise.all([
        fetch(`/api/menu?restaurant=${slug}`, { cache: "no-store" }),
        fetch(`/api/tables?restaurant=${slug}`, { cache: "no-store" })
      ]);

      if (menuResponse.ok) {
        const menuData = (await menuResponse.json()) as MenuItem[];
        if (menuData.length > 0) {
          setItems(menuData);
        }
      }

      if (tableResponse.ok) {
        const tableData = (await tableResponse.json()) as TableRow[];
        setTables(tableData);
      }
    };

    fetchData();

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("ordee-mvp-menu-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mesaParam, router]);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const category = visible?.target.getAttribute("data-category") as MenuCategory | null;
        if (category) setActiveCategory(category);
      },
      {
        rootMargin: "-80px 0px -50% 0px",
        threshold: [0.25, 0.5, 0.75]
      }
    );

    categories.forEach((category) => {
      const section = sectionRefs.current[category];
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
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

  const onSelectTable = (value: string) => {
    setTableNumber(value);
    window.localStorage.setItem("ordee_table", value);
  };

  const goToCategory = (category: MenuCategory) => {
    sectionRefs.current[category]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="space-y-5 pb-10">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">La parrilla de Don Jose</p>
        <h1 className="text-3xl font-bold text-brand-gold md:text-4xl">Bienvenido/a {name}</h1>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-brand-card p-3">
        <label className="text-sm text-zinc-300">
          Mesa
          <select value={tableNumber} onChange={(event) => onSelectTable(event.target.value)} className="ml-2 rounded bg-zinc-900 px-2 py-1">
            {tables.map((table) => (
              <option key={table.id} value={table.table_number}>
                {table.table_number}
              </option>
            ))}
          </select>
        </label>
        <Link href="/cart" className="rounded-lg border border-brand-gold px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold hover:text-black">
          Ver carrito ({cartCount})
        </Link>
      </div>

      <div className="sticky top-[58px] z-20 -mx-4 border-y border-zinc-800/80 bg-brand-bg/95 px-4 py-2 shadow-sm backdrop-blur md:top-[62px]">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => goToCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                activeCategory === category ? "bg-brand-gold text-black" : "bg-zinc-900 text-zinc-200"
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
          className="space-y-3 scroll-mt-32"
        >
          <h2 className="text-2xl font-semibold">{categoryLabels[category]}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {grouped[category].map((item) => (
              <MenuCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
