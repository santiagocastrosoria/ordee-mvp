"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { requestCustomerHelp } from "@/lib/request-help";
import { parseRestaurantSlugFromPath } from "@/lib/restaurant-routes";
import { getSessionForSlug } from "@/lib/session";

export function HelpButton() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const restaurantSlug = useMemo(
    () => parseRestaurantSlugFromPath(pathname) ?? getDefaultRestaurantSlug(),
    [pathname]
  );

  // The help button lives inline inside the menu's sticky categories row, so
  // hide the floating one on the login screen and on any menu route
  // (flat /menu and scoped /r/<slug>/menu).
  if (pathname === "/" || pathname.endsWith("/menu")) return null;

  const requestHelp = async () => {
    setLoading(true);
    const session = getSessionForSlug(restaurantSlug);
    console.info(
      "[ORDEE soporte cliente] POST /api/soporte slug=",
      restaurantSlug,
      "mesa=",
      session?.tableNumber ?? "(sin sesión)"
    );

    const { ok, status } = await requestCustomerHelp(restaurantSlug);

    setLoading(false);
    if (!ok) {
      console.error("[ORDEE soporte cliente] FALLA status=", status);
    }
    setMessage(
      ok ? "Aviso enviado" : status === 401 ? "Inicia sesión primero" : `No se pudo enviar (${status})`
    );
    window.setTimeout(() => setMessage(""), 2500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-30 flex max-w-[80vw] flex-col items-end gap-2 md:bottom-6 md:right-6">
      <button
        type="button"
        onClick={requestHelp}
        disabled={loading}
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 hover:bg-red-500 disabled:opacity-70"
      >
        {loading ? "Enviando..." : "Necesito ayuda"}
      </button>
      {message ? (
        <span className="rounded-lg border border-brand-border bg-brand-card px-2.5 py-1 text-xs font-medium text-brand-ink shadow-brand-sm">{message}</span>
      ) : null}
    </div>
  );
}
