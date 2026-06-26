"use client";

import { usePathname } from "next/navigation";
import { parseRestaurantSlugFromPath } from "@/lib/restaurant-routes";

export function CustomerMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isScopedCustomer = Boolean(parseRestaurantSlugFromPath(pathname));

  return (
    <main
      className={
        isScopedCustomer
          ? "mx-auto min-h-[calc(100dvh-53px)] max-w-6xl px-4 pb-6 pt-0"
          : "mx-auto max-w-6xl px-4 py-6"
      }
    >
      {children}
    </main>
  );
}
