import Link from "next/link";

export default function RestaurantNotFound() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-brand-border bg-brand-card p-8 text-center shadow-brand-sm">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-muted">ORDEE</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">Restaurante no encontrado</h1>
      <p className="mt-3 text-sm text-brand-muted">
        El enlace que abriste no corresponde a ningún restaurante activo. Revisá la dirección o pedí el QR correcto en
        tu mesa.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand-accentFg shadow-sm ordee-tap hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
