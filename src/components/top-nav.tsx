"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Carrito" },
  { href: "/checkout", label: "Checkout" }
];

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    setName(session?.name ?? null);
  }, []);

  if (pathname === "/") return null;

  const signOut = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-brand-bg/90 shadow-[0_6px_24px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        <Link href="/menu" className="text-lg font-bold tracking-wide text-brand-gold">
          ORDEE
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap items-center justify-end gap-1.5 text-sm">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    active ? "bg-brand-gold text-black" : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {name ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="hidden max-w-[120px] truncate md:inline">Hola, {name}</span>
              <button type="button" onClick={signOut} className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-700">
                Salir
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
