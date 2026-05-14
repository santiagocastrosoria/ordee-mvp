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
      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-brand-card p-6">
        <h1 className="text-3xl font-bold text-brand-gold">Pedido confirmado</h1>
        <p className="text-zinc-300">Tu pedido fue enviado a cocina y queda sincronizado en tiempo real.</p>
        {selectedPayment === "transferencia" ? <p className="font-mono text-sm">Alias de pago: {transferAlias}</p> : null}
        <p className="font-mono text-sm text-zinc-400">ID pedido: {orderId}</p>
        <p className="text-sm text-zinc-300">Estado cocina: {orderState?.status ?? "cargando..."}</p>
        <p className="text-sm text-zinc-300">Estado pago: {orderState?.payment_status ?? "cargando..."}</p>
        {orderState?.payment_method === "mercado_pago" && orderState?.payment_status !== "pagado" && mpPreferenceId && mercadoPagoPublicKey ? (
          <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
            <p className="text-sm text-zinc-300">Completa el pago con Mercado Pago:</p>
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
                className="inline-flex rounded-lg border border-brand-gold px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold hover:text-black"
              >
                Abrir checkout Mercado Pago en nueva pestaña
              </a>
            ) : null}
          </div>
        ) : null}
        {orderState?.payment_method === "mercado_pago" && orderState?.payment_status !== "pagado" && !mercadoPagoPublicKey ? (
          <p className="rounded bg-red-950/60 p-2 text-xs text-red-200">
            Falta `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`; no se puede renderizar Wallet Brick.
          </p>
        ) : null}
        <div className="flex gap-3">
          <Link href="/menu" className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-black">
            Volver al menu
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-gold">Checkout</h1>
        <p className="text-zinc-400">Revisa el resumen y elige como pagar.</p>
      </header>

      {checkoutError ? (
        <div className="rounded-xl border border-red-800 bg-red-950/60 p-4 text-sm">
          <p className="font-semibold text-red-200">{checkoutError}</p>
          {checkoutErrorDetail ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-red-100/90">
              {typeof checkoutErrorDetail === "string"
                ? checkoutErrorDetail
                : JSON.stringify(checkoutErrorDetail, null, 2)}
            </pre>
          ) : null}
          <p className="mt-2 text-xs text-red-300/80">
            Logs en consola del navegador (F12). En servidor: mirá la terminal donde corre `npm run dev` líneas `[ORDEE api/orders POST]`.
          </p>
        </div>
      ) : null}

      {showOrderDebug ? (
        <div className="rounded-xl border border-amber-700/70 bg-amber-950/30 p-4 text-sm">
          <p className="font-semibold text-amber-200">Debug pedidos</p>
          <p className="mt-1 text-amber-100/70">
            Probá insert sin carrito para aislar errores DB/realtime. En producción desactivalo (solo dev o NEXT_PUBLIC_ORDER_DEBUG=1).
          </p>
          <button
            type="button"
            onClick={createTestOrder}
            disabled={testOrderBusy}
            className="mt-2 rounded-lg border border-amber-600 px-3 py-2 text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
          >
            {testOrderBusy ? "Creando…" : "Crear pedido test"}
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-brand-card p-4">
          <label className="block text-sm">
            Nombre
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="mt-1 w-full rounded bg-zinc-900 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Mesa
            <input value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} className="mt-1 w-full rounded bg-zinc-900 px-3 py-2" />
          </label>
          <label className="block text-sm">
            Observaciones
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded bg-zinc-900 px-3 py-2" />
          </label>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-brand-card p-4">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {items.map((entry) => (
              <li key={entry.item.id} className="flex justify-between">
                <span>
                  {entry.quantity} x {entry.item.name}
                </span>
                <span>{formatArs(entry.item.price * entry.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-zinc-800 pt-3">
            <p className="text-sm text-zinc-400">Total</p>
            <p className="text-3xl font-bold text-brand-gold">{formatArs(total)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCheckoutError(null);
              setCheckoutErrorDetail(null);
              setOpenPaymentModal(true);
            }}
            disabled={loading || items.length === 0 || !customerName.trim()}
            className="mt-4 w-full rounded-lg bg-brand-gold px-4 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar Pedido y Pagar
          </button>
        </div>
      </div>

      {openPaymentModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
            <h3 className="text-xl font-semibold text-brand-gold">Checkout</h3>
            <p className="text-sm text-zinc-400">Monto final: {formatArs(total)}</p>
            <div className="space-y-2">
              {paymentOptions.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 rounded bg-zinc-900 px-3 py-2 text-sm">
                  <input type="radio" checked={selectedPayment === option.id} onChange={() => setSelectedPayment(option.id)} />
                  {option.label}
                </label>
              ))}
            </div>
            {selectedPayment === "transferencia" ? <p className="rounded bg-zinc-900 p-2 text-xs">Alias para pago: {transferAlias}</p> : null}
            {checkoutError ? (
              <div className="rounded border border-red-800 bg-red-950/50 p-2 text-xs text-red-200">
                {checkoutError}
              </div>
            ) : null}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpenPaymentModal(false)} className="flex-1 rounded bg-zinc-800 px-3 py-2">
                Cancelar
              </button>
              <button type="button" onClick={createOrder} className="flex-1 rounded bg-brand-gold px-3 py-2 font-semibold text-black" disabled={loading}>
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
    <Suspense fallback={<div>Cargando checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
