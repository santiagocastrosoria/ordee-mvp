"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSession, setSession } from "@/lib/session";

const MESAS = Array.from({ length: 30 }, (_, i) => String(i + 1));

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace("/menu");
    }
  }, [router]);

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
    router.replace("/menu");
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-brand-card p-6">
      <h1 className="text-3xl font-bold text-brand-gold">ORDEE</h1>
      <p className="mt-2 text-sm text-zinc-400">Ingresa tu nombre y mesa.</p>
      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          Nombre
          <input
            className="mt-1 w-full rounded bg-zinc-900 px-3 py-2"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tu nombre"
          />
        </label>
        <label className="block text-sm">
          Mesa
          <select
            className="mt-1 w-full rounded bg-zinc-900 px-3 py-2"
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
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button type="submit" className="w-full rounded-lg bg-brand-gold px-4 py-2 font-semibold text-black">
          Ingresar
        </button>
      </form>
    </section>
  );
}
