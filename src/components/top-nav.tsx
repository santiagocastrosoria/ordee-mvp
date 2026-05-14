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
  }, [pathname]);

  if (pathname === "/") return null;

  const signOut = () => {
    clearSession();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-bg/85 shadow-brand-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        <Link
          href="/menu"
          className="text-base font-semibold tracking-tight text-brand-ink transition duration-tap ease-out hover:opacity-70 active:scale-[0.98] sm:text-lg"
        >
          ORDEE
        </Link>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <nav className="flex flex-wrap items-center justify-end gap-1 text-xs sm:gap-1.5 sm:text-sm">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-2.5 py-1.5 font-medium transition duration-tap ease-out sm:px-3 sm:py-1.5 ${
                    active
                      ? "bg-brand-ink text-brand-accentFg shadow-sm active:scale-[0.98]"
                      : "text-brand-muted hover:bg-brand-soft hover:text-brand-ink active:scale-[0.98]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {name ? (
            <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-brand-muted sm:text-xs">
              <span className="hidden max-w-[140px] truncate md:inline">Bienvenido {name}</span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-brand-border bg-white px-2 py-1 font-medium text-brand-ink shadow-sm transition duration-tap ease-out hover:bg-brand-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 sm:px-2.5"
              >
                Salir
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
