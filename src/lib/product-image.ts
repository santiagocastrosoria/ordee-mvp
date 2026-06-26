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

/**
 * Resolves the image URL for a menu card.
 * When showImages is false, never returns a URL (no placeholders or guessing).
 * When showImages is true and imageUrl is set, returns absolute or site-relative path.
 */
export function resolveProductImage(item: MenuItem, showImages: boolean): string | null {
  if (!showImages) return null;

  const raw = (item.imageUrl ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return raw;
  return `/products/${raw}`;
}

/** @deprecated Use resolveProductImage — kept for any legacy callers. */
export function productImageSrc(item: MenuItem): string | null {
  return resolveProductImage(item, true);
}

export function productImageFallback(): string {
  return "/products/pizza.jpg";
}
