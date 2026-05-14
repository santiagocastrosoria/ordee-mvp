"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MercadoPagoWalletBrick } from "@/components/mercadopago-wallet-brick";
import { cartTotal, clearCart, getCart } from "@/lib/cart-storage";
import { formatArs } from "@/lib/format";
import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";
import { getSession } from "@/lib/session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CartItem, PaymentMethod } from "@/lib/types";

const paymentOptions: Array<{ id: PaymentMethod; label: string }> = [
  { id: "mercado_pago", label: "Mercado Pago" },
  { id: "transferencia", label: "Transferencia" },
  { id: "naranja_x", label: "Naranja X" },
  { id: "modo", label: "Modo" }
];

type OrderState = {
  id: string;
  status: string;
  payment_status: string;
  payment_method?: string;
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("mercado_pago");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutErrorDetail, setCheckoutErrorDetail] = useState<unknown>(null);
  const [testOrderBusy, setTestOrderBusy] = useState(false);
  const [mpPreferenceId, setMpPreferenceId] = useState<string | null>(null);
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string | null>(null);
  /** Botón temporal de prueba: dev siempre o con NEXT_PUBLIC_ORDER_DEBUG=1 */
  const showOrderDebug =
    process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ORDER_DEBUG === "1";

  const transferAlias = process.env.NEXT_PUBLIC_TRANSFER_ALIAS ?? "santi.castro.ap";
  const mercadoPagoPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

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

  const total = useMemo(() => cartTotal(items), [items]);

  const createOrder = async () => {
    setLoading(true);
    setCheckoutError(null);
    setCheckoutErrorDetail(null);
    setMpPreferenceId(null);
    setMpCheckoutUrl(null);

    const payload = {
      restaurantSlug: getDefaultRestaurantSlug(),
      customerName,
      tableNumber,
      notes,
      items,
      paymentMethod: selectedPayment
    };

    console.info("[ORDEE checkout] Confirmar Pedido → POST /api/orders", {
      itemsCount: items.length,
      paymentMethod: selectedPayment,
      customerNameLen: customerName.trim().length
    });

    let orderResponse: Response;
    try {
      orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      console.error("[ORDEE checkout] fetch falló (red/offline)", netErr);
      setCheckoutError("No se pudo contactar el servidor (/api/orders). ¿Next corriendo en el mismo origin?");
      setCheckoutErrorDetail(netErr instanceof Error ? netErr.message : String(netErr));
      setLoading(false);
      return;
    }

    const rawText = await orderResponse.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      parsed = { rawBody: rawText };
    }

    if (!orderResponse.ok) {
      console.error("[ORDEE checkout] POST /api/orders FALLA status=", orderResponse.status, parsed);
      const body = parsed as Record<string, unknown>;
      const msg =
        typeof body?.error === "string"
          ? body.error
          : `Error HTTP ${orderResponse.status}`;
      const detailLine =
        typeof body?.detail === "string"
          ? body.detail
          : typeof body?.step === "string"
            ? `step: ${body.step}`
            : rawText.slice(0, 500);
      setCheckoutError(`${msg} — ${detailLine}`);
      setCheckoutErrorDetail(parsed);
      setLoading(false);
      return;
    }

    const orderData = parsed as { orderId: string; total: number };

    if (!orderData.orderId) {
      console.error("[ORDEE checkout] Respuesta OK pero sin orderId", parsed);
      setCheckoutError("Respuesta sin orderId — revisá Network en DevTools.");
      setCheckoutErrorDetail(parsed);
      setLoading(false);
      return;
    }

    console.info("[ORDEE checkout] orden creada en DB orderId=", orderData.orderId, "total=", orderData.total);

    if (selectedPayment === "mercado_pago") {
      console.info("[ORDEE checkout] Creando preference Mercado Pago…");
      const preferenceResponse = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          title: `Pedido ORDEE #${orderData.orderId.slice(0, 8)}`,
          quantity: 1,
          unitPrice: orderData.total
        })
      });
      const prefText = await preferenceResponse.text();
      let prefParsed: Record<string, unknown> = {};
      try {
        prefParsed = JSON.parse(prefText) as Record<string, unknown>;
      } catch {
        prefParsed = { raw: prefText };
      }

      if (preferenceResponse.ok) {
        const checkoutUrl =
          typeof prefParsed.checkoutUrl === "string" ? prefParsed.checkoutUrl : undefined;
        const preferenceId =
          typeof prefParsed.preferenceId === "string" ? prefParsed.preferenceId : undefined;
        if (preferenceId) {
          console.info("[ORDEE checkout] preference creada", preferenceId);
          setMpPreferenceId(preferenceId);
        }
        if (checkoutUrl) {
          setMpCheckoutUrl(checkoutUrl);
        }

        clearCart();
        setOrderId(orderData.orderId);
        setOpenPaymentModal(false);
        setLoading(false);

        if (!preferenceId && checkoutUrl) {
          console.info("[ORDEE checkout] Sin preferenceId usable, fallback a checkout URL");
          window.location.href = checkoutUrl;
          return;
        }

        if (preferenceId) {
          return;
        }

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
        console.warn("[ORDEE checkout] preference OK pero sin checkoutUrl", prefParsed);
        setCheckoutError("Mercado Pago no devolvió URL de checkout. El pedido SÍ existe en Supabase.");
        setCheckoutErrorDetail(prefParsed);
        setLoading(false);
        return;
      }
      console.error("[ORDEE checkout] preference FALLA", preferenceResponse.status, prefParsed);
      setCheckoutError(
        `Mercado Pago (${preferenceResponse.status}): ${String(prefParsed.error ?? prefText)}. El pedido quedó creado.`
      );
      setCheckoutErrorDetail(prefParsed);
      setLoading(false);
      clearCart();
      setOrderId(orderData.orderId);
      setOpenPaymentModal(false);
      return;
    }

    const confirmResp = await fetch("/api/pagos/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderData.orderId, paymentMethod: selectedPayment })
    });
    const confirmText = await confirmResp.text();
    if (!confirmResp.ok) {
      console.error("[ORDEE checkout] /api/pagos/confirm FALLA", confirmResp.status, confirmText);
      setCheckoutError(`Pago manual no confirmado HTTP ${confirmResp.status}. Pedido existe: ${orderData.orderId}`);
      setCheckoutErrorDetail(confirmText);
    } else {
      console.info("[ORDEE checkout] pago manual confirm OK");
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

  if (orderId) {
    return (
      <section className="space-y-4 rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand-sm sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">Pedido confirmado</h1>
        <p className="text-sm leading-relaxed text-brand-muted">Tu pedido fue enviado a cocina y queda sincronizado en tiempo real.</p>
        {selectedPayment === "transferencia" ? (
          <p className="rounded-lg border border-brand-border bg-brand-soft px-3 py-2 font-mono text-sm text-brand-ink">Alias de pago: {transferAlias}</p>
        ) : null}
        <p className="font-mono text-xs text-brand-muted sm:text-sm">ID pedido: {orderId}</p>
        <p className="text-sm text-brand-muted">Estado cocina: <span className="font-medium text-brand-ink">{orderState?.status ?? "cargando..."}</span></p>
        <p className="text-sm text-brand-muted">Estado pago: <span className="font-medium text-brand-ink">{orderState?.payment_status ?? "cargando..."}</span></p>
        {orderState?.payment_method === "mercado_pago" && orderState?.payment_status !== "pagado" && mpPreferenceId && mercadoPagoPublicKey ? (
          <div className="space-y-3 rounded-xl border border-brand-border bg-brand-soft p-4">
            <p className="text-sm font-medium text-brand-ink">Completa el pago con Mercado Pago:</p>
            <MercadoPagoWalletBrick
              publicKey={mercadoPagoPublicKey}
              preferenceId={mpPreferenceId}
              onReady={() => console.info("[ORDEE checkout] Wallet Brick listo")}
              onSubmit={() => console.info("[ORDEE checkout] Wallet Brick submit")}
              onError={(error) => console.error("[ORDEE checkout] Wallet Brick error", error)}
            />
            {mpCheckoutUrl ? (
              <a
                href={mpCheckoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-medium text-brand-ink shadow-sm transition duration-tap ease-out hover:bg-brand-soft active:scale-[0.99]"
              >
                Abrir checkout Mercado Pago en nueva pestaña
              </a>
            ) : null}
          </div>
        ) : null}
        {orderState?.payment_method === "mercado_pago" && orderState?.payment_status !== "pagado" && !mercadoPagoPublicKey ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            Falta `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`; no se puede renderizar Wallet Brick.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/menu"
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-accentFg shadow-sm transition duration-tap ease-out hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
          >
            Volver al menu
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
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition duration-tap ease-out ${
                    selectedPayment === option.id
                      ? "border-brand-ink bg-brand-ink text-brand-accentFg shadow-sm"
                      : "border-brand-border bg-white text-brand-ink hover:border-brand-muted/40 hover:bg-brand-soft"
                  }`}
                >
                  <input type="radio" className="h-4 w-4 accent-brand-ink" checked={selectedPayment === option.id} onChange={() => setSelectedPayment(option.id)} />
                  {option.label}
                </label>
              ))}
            </div>
            {selectedPayment === "transferencia" ? (
              <p className="rounded-lg border border-brand-border bg-brand-soft p-2 text-xs text-brand-muted">
                Alias para pago: <span className="font-mono font-medium text-brand-ink">{transferAlias}</span>
              </p>
            ) : null}
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
