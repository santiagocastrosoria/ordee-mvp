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
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-brand-card p-6">
      <h1 className="text-2xl font-bold text-brand-gold">Mi cuenta (cliente)</h1>
      <p className="text-sm text-zinc-400">Ingresa para probar la app como comensal. El menu sigue siendo publico.</p>
      <label className="block text-sm">
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded bg-zinc-900 px-3 py-2" />
      </label>
      <label className="block text-sm">
        Contrasena
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded bg-zinc-900 px-3 py-2"
        />
      </label>
      <button
        type="button"
        onClick={signIn}
        disabled={loading || !email || !password}
        className="w-full rounded-lg bg-brand-gold px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      <Link href="/menu" className="block text-center text-sm text-brand-gold">
        Volver al menu
      </Link>
    </section>
  );
}
