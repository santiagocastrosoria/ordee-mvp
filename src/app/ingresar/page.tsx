"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function IngresarClientePage() {
  const router = useRouter();
  const [email, setEmail] = useState("scastrosoria@gmail.com");
  const [password, setPassword] = useState("123456789");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Listo. Ya podes seguir con el menu.");
    setLoading(false);
    router.push("/menu");
  };

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-brand-border bg-brand-card p-6 shadow-brand-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Mi cuenta (cliente)</h1>
      <p className="text-sm text-brand-muted">Ingresa para probar la app como comensal. El menu sigue siendo publico.</p>
      <label className="block text-sm font-medium text-brand-ink">
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="ordee-input" type="email" autoComplete="email" />
      </label>
      <label className="block text-sm font-medium text-brand-ink">
        Contrasena
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ordee-input" autoComplete="current-password" />
      </label>
      <button
        type="button"
        onClick={signIn}
        disabled={loading || !email || !password}
        className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm ordee-tap-lg hover:opacity-90 disabled:opacity-45"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      {message ? <p className="text-sm text-brand-muted">{message}</p> : null}
      <Link href="/menu" className="block text-center text-sm font-medium text-brand-ink underline-offset-4 hover:underline">
        Volver al menu
      </Link>
    </section>
  );
}
