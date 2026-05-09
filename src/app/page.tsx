"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { isValidEmail, nameFromEmail, TEMP_PASSWORD } from "@/lib/auth-temp";
import { getSession, setSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace("/menu");
    }
  }, [router]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Ingresa un mail valido.");
      return;
    }
    if (password !== TEMP_PASSWORD) {
      setError("Contrasena incorrecta.");
      return;
    }

    setSession({
      email: email.trim(),
      name: nameFromEmail(email),
      role: "cliente",
      createdAt: new Date().toISOString()
    });
    router.replace("/menu");
  };

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-brand-card p-6">
      <h1 className="text-3xl font-bold text-brand-gold">Ingresar a ORDEE</h1>
      <p className="mt-2 text-sm text-zinc-400">Menu digital para pedir y pagar sin esperar.</p>
      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">
          Mail
          <input
            className="mt-1 w-full rounded bg-zinc-900 px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@mail.com"
          />
        </label>
        <label className="block text-sm">
          Contrasena
          <input
            className="mt-1 w-full rounded bg-zinc-900 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="123456789"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button type="submit" className="w-full rounded-lg bg-brand-gold px-4 py-2 font-semibold text-black">
          Ingresar
        </button>
      </form>
    </section>
  );
}
