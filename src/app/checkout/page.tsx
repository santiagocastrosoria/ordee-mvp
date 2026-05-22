"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cartTotal, clearCart, getCart } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { getSession } from "@/lib/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CartItem, PaymentMethod } from "@/lib/types";

const paymentOptions: Array<{ id: PaymentMethod; label: string; description?: string }> = [
  { id: "efectivo", label: "Efectivo", description: "Pagás en caja al retirar. El pedido va directo a cocina." },
  {
    id: "mercado_pago",
    label: "Tarjeta o billetera virtual",
    description: "Mercado Pago. Cocina recibe el pedido cuando el pago se aprueba."
  }
];

type OrderState = {
  id: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  table_number?: string | null;
};

function CheckoutContent() { 
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(searchParams.get("orderId"));
  const [orderState, setOrderState] = useState<OrderState | null>(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("efectivo");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutErrorDetail, setCheckoutErrorDetail] = useState<unknown>(null);
  const [testOrderBusy, setTestOrderBusy] = useState(false);
  const [mpWaiting, setMpWaiting] = useState(false);
  /** Botón temporal de prueba: dev siempre o con NEXT_PUBLIC_ORDER_DEBUG=1 */
  const showOrderDebug =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ORDER_DEBUG === "1";

  const mpResult = searchParams.get("mp");
  const mpSessionId = searchParams.get("sessionId");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }

    setCustomerName(session.name);
    setTableNumber(session.tableNumber ?? window.localStorage.getItem("ordee_table") ?? "1");
    setItems(getCart());
  }, [router]);

  useEffect(() => {
    if (!orderId) return;

    const syncOrderState = async () => {
      const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (!response.ok) return;
      setOrderState((await response.json()) as OrderState);
    };

    syncOrderState();
    const id = window.setInterval(syncOrderState, 3000);
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return () => window.clearInterval(id);
    }

    const channel = supabase
      .channel(`ordee-mvp-order-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        console.info("[ORDEE checkout realtime] orden", orderId, payload.eventType);
        syncOrderState();
      })
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[ORDEE checkout realtime] CHANNEL_ERROR", err);
        } else if (status === "SUBSCRIBED") {
          console.info("[ORDEE checkout realtime] SUBSCRIBED orders id=", orderId);
        }
      });

    return () => {
      window.clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (!orderState) return;
    if (orderState.payment_status === "pagado") {
      console.info("[ORDEE checkout] pago aprobado", { orderId: orderState.id, paymentMethod: orderState.payment_method });
    } else if (orderState.payment_status === "fallido") {
      console.warn("[ORDEE checkout] pago rechazado", { orderId: orderState.id, paymentMethod: orderState.payment_method });
    }
  }, [orderState]);

  useEffect(() => {
    if (!mpSessionId || mpResult !== "success") return;

    setMpWaiting(true);
    setCheckoutError(null);

    let attempts = 0;
    const maxAttempts = 30;

    const poll = async () => {
      attempts += 1;
      const res = await fetch(`/api/mercadopago/session/${mpSessionId}`, { cache: "no-store" });
      if (!res.ok) {
        if (attempts >= maxAttempts) {
          setCheckoutError("No pudimos confirmar el pago. Si ya pagaste, el pedido puede aparecer en cocina en unos segundos.");
          setMpWaiting(false);
        }
        return;
      }
      const data = (await res.json()) as { status: string; orderId: string | null };
      if (data.orderId) {
        clearCart();
        setOrderId(data.orderId);
        setMpWaiting(false);
        router.replace(`/checkout?orderId=${data.orderId}`);
        return;
      }
      if (data.status === "failed") {
        setCheckoutError("El pago no se completó. Intentá de nuevo.");
        setMpWaiting(false);
        return;
      }
      if (attempts < maxAttempts) {
        window.setTimeout(poll, 2000);
      } else {
        setCheckoutError("Pago en proceso. Si Mercado Pago aprobó el cobro, el pedido llegará a cocina automáticamente.");
        setMpWaiting(false);
      }
    };

    poll();
    return () => {
      attempts = maxAttempts;
    };
  }, [mpSessionId, mpResult, router]);

  useEffect(() => {
    if (mpResult === "failure" && mpSessionId) {
      setCheckoutError("El pago fue cancelado o rechazado. Podés intentar de nuevo.");
    }
  }, [mpResult, mpSessionId]);

  const total = useMemo(() => cartTotal(items), [items]);

  const createOrder = async () => {
    setLoading(true);
    setCheckoutError(null);
    setCheckoutErrorDetail(null);

    const basePayload = {
      restaurantSlug: getDefaultRestaurantSlug(),
      customerName,
      tableNumber,
      notes,
      items
    };

    if (notes.trim()) {
      console.info("[checkout notes]", { notes: notes.trim(), table: tableNumber, customer: customerName });
    }

    if (selectedPayment === "mercado_pago") {
      console.info("[ORDEE checkout] Checkout Pro → create-preference");
      let prefResponse: Response;
      try {
        prefResponse = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(basePayload)
        });
      } catch (netErr) {
        setCheckoutError("No se pudo contactar Mercado Pago.");
        setCheckoutErrorDetail(netErr instanceof Error ? netErr.message : String(netErr));
        setLoading(false);
        return;
      }

      const prefText = await prefResponse.text();
      let prefParsed: Record<string, unknown> = {};
      try {
        prefParsed = JSON.parse(prefText) as Record<string, unknown>;
      } catch {
        prefParsed = { raw: prefText };
      }

      if (!prefResponse.ok) {
        setCheckoutError(String(prefParsed.error ?? `Error HTTP ${prefResponse.status}`));
        setCheckoutErrorDetail(prefParsed);
        setLoading(false);
        return;
      }

      const checkoutUrl = typeof prefParsed.checkoutUrl === "string" ? prefParsed.checkoutUrl : null;
      if (!checkoutUrl) {
        setCheckoutError("Mercado Pago no devolvió URL de Checkout Pro.");
        setCheckoutErrorDetail(prefParsed);
        setLoading(false);
        return;
      }

      setOpenPaymentModal(false);
      setLoading(false);
      window.location.href = checkoutUrl;
      return;
    }

    let orderResponse: Response;
    try {
      orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayload, paymentMethod: selectedPayment })
      });
    } catch (netErr) {
      setCheckoutError("No se pudo contactar el servidor.");
      setCheckoutErrorDetail(netErr instanceof Error ? netErr.message : String(netErr));
      setLoading(false);
      return;
    }

    const rawText = await orderResponse.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      parsed = { raw: rawText };
    }

    if (!orderResponse.ok) {
      setCheckoutError(String(parsed.error ?? `Error HTTP ${orderResponse.status}`));
      setCheckoutErrorDetail(parsed);
      setLoading(false);
      return;
    }

    const orderData = parsed as { orderId?: string };
    if (!orderData.orderId) {
      setCheckoutError("Respuesta sin orderId.");
      setLoading(false);
      return;
    }

    if (selectedPayment === "efectivo") {
      window.alert(
        `Cobrar en efectivo — Mesa ${(tableNumber || "").trim() || "—"}\n\nEl pedido ya está en cocina. Mostrá este aviso en caja al pagar.`
      );
    }

    clearCart();
    setOrderId(orderData.orderId);
    setLoading(false);
    setOpenPaymentModal(false);
  };

  const createTestOrder = async () => {
    setTestOrderBusy(true);
    setCheckoutError(null);
    setCheckoutErrorDetail(null);
    console.info("[ORDEE checkout] Crear pedido test → POST /api/debug/create-test-order");
    const res = await fetch("/api/debug/create-test-order", { method: "POST" });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      console.error("[ORDEE checkout] pedido test FALLA", res.status, data);
      setCheckoutError(`Test order: ${String(data.error ?? text)}`);
      setCheckoutErrorDetail(data);
      setTestOrderBusy(false);
      return;
    }
    console.info("[ORDEE checkout] pedido test OK", data);
    alert(`Pedido test creado: ${String(data.orderId)} — debe verse en Cocina realtime.`);
    setTestOrderBusy(false);
  };

  if (mpWaiting) {
    return (
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-5 rounded-2xl border border-brand-border bg-brand-card p-8 text-center shadow-brand-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-brand-border">
          <svg className="h-7 w-7 animate-spin text-brand-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-brand-ink">Confirmando tu pago…</p>
          <p className="mt-1 text-sm text-brand-muted">Esperá unos segundos. Mercado Pago está procesando el cobro.</p>
        </div>
      </section>
    );
  }

  if (orderId) {
    const isApprovedMp = orderState?.payment_method === "mercado_pago" && orderState?.payment_status === "pagado";
    const isCash = orderState?.payment_method === "efectivo";
    const stillLoading = !orderState;

    if (isApprovedMp) {
      console.info("[payment approved]", { orderId, paymentMethod: orderState.payment_method });
      return (
        <section className="flex flex-col items-center gap-6 rounded-2xl border border-brand-border bg-brand-card p-8 text-center shadow-brand-sm sm:p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">PAGO CONFIRMADO</h1>
            <p className="text-sm text-brand-muted">Su pedido ya está en preparación</p>
          </div>
          <div className="w-full rounded-xl border border-brand-border bg-brand-soft px-4 py-3 text-sm">
            <p className="text-brand-muted">Mesa <span className="font-semibold text-brand-ink">{orderState.table_number ?? "—"}</span></p>
            <p className="mt-1 font-mono text-xs text-brand-muted">#{orderId.slice(0, 8).toUpperCase()}</p>
          </div>
          <Link
            href="/menu"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.98]"
          >
            Volver al menú
          </Link>
        </section>
      );
    }

    return (
      <section className="space-y-4 rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft">
            <svg className="h-5 w-5 text-brand-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-brand-ink sm:text-2xl">Pedido recibido</h1>
        </div>
        <p className="text-sm leading-relaxed text-brand-muted">Tu pedido fue enviado a cocina y queda sincronizado en tiempo real.</p>
        {isCash ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950">
            Cobrar en efectivo · Mesa {orderState.table_number ?? "—"}
          </p>
        ) : null}
        <p className="font-mono text-xs text-brand-muted sm:text-sm">ID: {orderId.slice(0, 8).toUpperCase()}</p>
        {!stillLoading ? (
          <p className="text-sm text-brand-muted">
            Estado: <span className="font-medium text-brand-ink">{orderState.status}</span>
          </p>
        ) : (
          <p className="text-sm text-brand-muted">Cargando estado…</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/menu"
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
          >
            Volver al menú
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5 sm:space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-brand-muted">Revisa el resumen y elige como pagar.</p>
      </header>

      {checkoutError ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm shadow-brand-sm">
          <p className="font-semibold text-red-900">{checkoutError}</p>
          {checkoutErrorDetail ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-red-100 bg-white/80 p-2 font-mono text-xs text-red-900/90">
              {typeof checkoutErrorDetail === "string"
                ? checkoutErrorDetail
                : JSON.stringify(checkoutErrorDetail, null, 2)}
            </pre>
          ) : null}
          <p className="mt-2 text-xs text-red-800/80">
            Logs en consola del navegador (F12). En servidor: mirá la terminal donde corre `npm run dev` líneas `[ORDEE api/orders POST]`.
          </p>
        </div>
      ) : null}

      {showOrderDebug ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm shadow-brand-sm">
          <p className="font-semibold text-amber-900">Debug pedidos</p>
          <p className="mt-1 text-amber-900/80">
            Probá insert sin carrito para aislar errores DB/realtime. En producción desactivalo (solo dev o NEXT_PUBLIC_ORDER_DEBUG=1).
          </p>
          <button
            type="button"
            onClick={createTestOrder}
            disabled={testOrderBusy}
            className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-950 transition duration-tap ease-out hover:bg-amber-100 disabled:opacity-50"
          >
            {testOrderBusy ? "Creando…" : "Crear pedido test"}
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 rounded-xl border border-brand-border bg-brand-card p-4 shadow-brand-sm sm:space-y-2 sm:p-5">
          <label className="block text-sm font-medium text-brand-ink">
            Nombre
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="ordee-input" />
          </label>
          <label className="block text-sm font-medium text-brand-ink">
            Mesa
            <input value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} className="ordee-input" inputMode="numeric" />
          </label>
          <label className="block text-sm font-medium text-brand-ink">
            Observaciones
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="ordee-textarea" rows={3} />
          </label>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-card p-4 shadow-brand-sm sm:p-5">
          <h2 className="text-base font-semibold text-brand-ink sm:text-lg">Resumen</h2>
          <ul className="mt-3 space-y-2 border-b border-brand-border pb-3 text-sm">
            {items.map((entry) => (
              <li key={entry.item.id} className="flex justify-between gap-3 text-brand-muted">
                <span className="min-w-0 text-brand-ink">
                  {entry.quantity} × {entry.item.name}
                </span>
                <span className="shrink-0 tabular-nums font-medium text-brand-ink">{formatArs(entry.item.price * entry.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">Total</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-brand-ink sm:text-3xl">{formatArs(total)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCheckoutError(null);
              setCheckoutErrorDetail(null);
              setOpenPaymentModal(true);
            }}
            disabled={loading || items.length === 0 || !customerName.trim()}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Confirmar Pedido y Pagar
          </button>
        </div>
      </div>

      {openPaymentModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/25 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-brand-border bg-brand-card p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-brand-ink sm:text-xl">Elegir pago</h3>
            <p className="text-sm text-brand-muted">Monto final: <span className="font-semibold tabular-nums text-brand-ink">{formatArs(total)}</span></p>
            <div className="space-y-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-stretch gap-3 rounded-xl border px-3 py-2.5 text-sm transition duration-tap ease-out ${
                    selectedPayment === option.id
                      ? "border-brand-ink bg-brand-ink text-brand-accentFg shadow-sm"
                      : "border-brand-border bg-white text-brand-ink hover:border-brand-muted/40 hover:bg-brand-soft"
                  }`}
                >
                  <input
                    type="radio"
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-ink"
                    checked={selectedPayment === option.id}
                    onChange={() => setSelectedPayment(option.id)}
                  />
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    {option.description ? (
                      <span
                        className={`mt-1 block text-xs font-normal leading-snug ${
                          selectedPayment === option.id ? "text-brand-accentFg/85" : "text-brand-muted"
                        }`}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            {checkoutError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-900">
                {checkoutError}
              </div>
            ) : null}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpenPaymentModal(false)}
                className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm font-semibold text-brand-ink shadow-sm transition duration-tap ease-out hover:bg-brand-soft active:scale-[0.99]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={createOrder}
                className="flex-1 rounded-lg bg-brand-accent px-3 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.99] disabled:opacity-45"
                disabled={loading}
              >
                {loading ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-sm text-brand-muted">Cargando checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
