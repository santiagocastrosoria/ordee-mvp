"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSession, setSession } from "@/lib/session";

const MESAS = Array.from({ length: 30 }, (_, i) => String(i + 1));

interface LoginScreenProps {
  /** Route prefix: "" for flat routes, "/r/<slug>" for scoped routes. */
  basePath: string;
  /** Optional restaurant display name shown under the title (scoped routes). */
  restaurantName?: string;
}

export function LoginScreen({ basePath, restaurantName }: LoginScreenProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState("");

  // Slug-aware menu target: flat "/menu" or scoped "/r/<slug>/menu".
  const menuPath = `${basePath}/menu`;

  useEffect(() => {
    if (getSession()) {
      router.replace(menuPath);
    }
  }, [router, menuPath]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (!tableNumber) {
      setError("Elige una mesa.");
      return;
    }

    setError("");
    setSession({
      name: trimmed,
      tableNumber,
      role: "cliente",
      createdAt: new Date().toISOString()
    });
    window.localStorage.setItem("ordee_table", tableNumber);
    router.replace(menuPath);
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-brand-card p-6 shadow-brand-sm">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-ink">ORDEE</h1>
      {restaurantName ? (
        <p className="mt-1 text-sm font-medium text-brand-ink">{restaurantName}</p>
      ) : null}
      <p className="mt-2 text-sm text-brand-muted">Ingresa tu nombre y mesa.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-brand-ink">
          Nombre
          <input
            className="ordee-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-medium text-brand-ink">
          Mesa
          <select
            className="ordee-input cursor-pointer appearance-none bg-[length:1rem_1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
            value={tableNumber}
            onChange={(event) => setTableNumber(event.target.value)}
          >
            <option value="">Elegir mesa</option>
            {MESAS.map((m) => (
              <option key={m} value={m}>
                Mesa {m}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm ordee-tap-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
        >
          Ingresar
        </button>
      </form>
    </section>
  );
}
