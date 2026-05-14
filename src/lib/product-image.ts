import { MenuItem } from "@/lib/types";

/** Slug estable para convención `/products/{slug}.jpg` al subir fotos manualmente. */
export function productNameSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const FALLBACK = "/products/pizza.jpg";

/**
 * URL final para la card: respeta `imageUrl` absoluto o bajo `/`;
 * si viene vacío o relativo raro, intenta `/products/{slug}.jpg` desde el nombre.
 */
export function productImageSrc(item: MenuItem): string {
  const raw = (item.imageUrl ?? "").trim();
  if (!raw) {
    const slug = productNameSlug(item.name);
    return slug ? `/products/${slug}.jpg` : FALLBACK;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  return `/products/${productNameSlug(item.name)}.jpg`;
}

export function productImageFallback(): string {
  return FALLBACK;
}
