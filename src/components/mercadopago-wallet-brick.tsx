"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (
          type: "wallet",
          containerId: string,
          settings: {
            initialization: { preferenceId: string };
            customization?: Record<string, unknown>;
            callbacks?: {
              onReady?: () => void;
              onError?: (error: unknown) => void;
              onSubmit?: () => void;
            };
          }
        ) => Promise<{ unmount?: () => void }>;
      };
    };
  }
}

interface MercadoPagoWalletBrickProps {
  publicKey: string;
  preferenceId: string;
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onSubmit?: () => void;
}

const SCRIPT_ID = "mercadopago-sdk";
const CONTAINER_ID = "mp-wallet-brick-container";

function ensureMercadoPagoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar SDK Mercado Pago")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar SDK Mercado Pago"));
    document.head.appendChild(script);
  });
}

export function MercadoPagoWalletBrick({ publicKey, preferenceId, onReady, onError, onSubmit }: MercadoPagoWalletBrickProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const brickControllerRef = useRef<{ unmount?: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderBrick = async () => {
      try {
        setLoadError(null);
        await ensureMercadoPagoSdk();
        if (cancelled) return;
        if (!window.MercadoPago) throw new Error("SDK Mercado Pago no disponible");

        const mp = new window.MercadoPago(publicKey, { locale: "es-AR" });
        const bricksBuilder = mp.bricks();

        brickControllerRef.current = await bricksBuilder.create("wallet", CONTAINER_ID, {
          initialization: { preferenceId },
          customization: { texts: { valueProp: "smart_option" } },
          callbacks: {
            onReady: () => onReady?.(),
            onError: (error: unknown) => {
              setLoadError("No se pudo renderizar Wallet Brick.");
              onError?.(error);
            },
            onSubmit: () => onSubmit?.()
          }
        });
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Error cargando Wallet Brick");
        onError?.(error);
      }
    };

    renderBrick();

    return () => {
      cancelled = true;
      brickControllerRef.current?.unmount?.();
      brickControllerRef.current = null;
    };
  }, [onError, onReady, onSubmit, preferenceId, publicKey]);

  return (
    <div className="space-y-2">
      <div id={CONTAINER_ID} />
      {loadError ? <p className="text-xs text-red-300">{loadError}</p> : null}
    </div>
  );
}
