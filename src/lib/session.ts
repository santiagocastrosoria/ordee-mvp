"use client";

import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export interface AppSession {
  name: string;
  tableNumber: string;
  role: "cliente";
  restaurantSlug: string;
  createdAt: string;
}

const LEGACY_KEY = "ordee_mvp_session";
const LEGACY_TABLE_KEY = "ordee_table";

function sessionKey(restaurantSlug: string): string {
  return `ordee_session_${restaurantSlug.trim()}`;
}

function isValidSession(value: unknown): value is AppSession {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  const hasSlug = typeof o.restaurantSlug === "string" && o.restaurantSlug.trim() !== "";
  return (
    typeof o.name === "string" &&
    o.name.trim() !== "" &&
    typeof o.tableNumber === "string" &&
    o.tableNumber.trim() !== "" &&
    o.role === "cliente" &&
    typeof o.createdAt === "string" &&
    hasSlug
  );
}

/** Legacy sessions without restaurantSlug are treated as demo-ordee on flat routes. */
function normalizeSession(raw: unknown): AppSession | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.name !== "string" ||
    o.name.trim() === "" ||
    typeof o.tableNumber !== "string" ||
    o.tableNumber.trim() === "" ||
    o.role !== "cliente" ||
    typeof o.createdAt !== "string"
  ) {
    return null;
  }

  const restaurantSlug =
    typeof o.restaurantSlug === "string" && o.restaurantSlug.trim() !== ""
      ? o.restaurantSlug.trim()
      : getDefaultRestaurantSlug();

  return {
    name: o.name,
    tableNumber: o.tableNumber,
    role: "cliente",
    restaurantSlug,
    createdAt: o.createdAt
  };
}

function migrateLegacySessionIfNeeded(slug: string): void {
  if (typeof window === "undefined") return;

  const targetKey = sessionKey(slug);
  if (window.localStorage.getItem(targetKey)) return;

  const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) return;

  const demoSlug = getDefaultRestaurantSlug();

  let session: AppSession | null;
  try {
    session = normalizeSession(JSON.parse(legacyRaw));
  } catch {
    return;
  }
  if (!session) return;

  if (slug !== session.restaurantSlug) {
    if (slug !== demoSlug || session.restaurantSlug !== demoSlug) return;
  }

  const legacyTable = window.localStorage.getItem(LEGACY_TABLE_KEY);
  if (legacyTable?.trim()) {
    session = { ...session, tableNumber: legacyTable.trim() };
  }

  window.localStorage.setItem(targetKey, JSON.stringify(session));
  window.localStorage.removeItem(LEGACY_KEY);
  window.localStorage.removeItem(LEGACY_TABLE_KEY);
}

/** @deprecated Use getSessionForSlug(restaurantSlug) for scoped routes. */
export function getSession(): AppSession | null {
  return getSessionForSlug(getDefaultRestaurantSlug());
}

export function getSessionForSlug(restaurantSlug: string): AppSession | null {
  if (typeof window === "undefined") return null;

  const slug = restaurantSlug.trim();
  if (!slug) return null;

  migrateLegacySessionIfNeeded(slug);

  const raw = window.localStorage.getItem(sessionKey(slug));
  if (!raw) return null;

  try {
    const session = normalizeSession(JSON.parse(raw));
    if (!session || session.restaurantSlug !== slug) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSession(session: AppSession): void {
  if (typeof window === "undefined") return;
  const slug = session.restaurantSlug.trim();
  window.localStorage.setItem(sessionKey(slug), JSON.stringify({ ...session, restaurantSlug: slug }));
  window.localStorage.removeItem(LEGACY_KEY);
  window.localStorage.removeItem(LEGACY_TABLE_KEY);
}

export function clearSessionForSlug(restaurantSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(sessionKey(restaurantSlug.trim()));
}

/** @deprecated Use clearSessionForSlug(restaurantSlug). */
export function clearSession(): void {
  clearSessionForSlug(getDefaultRestaurantSlug());
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_KEY);
  window.localStorage.removeItem(LEGACY_TABLE_KEY);
}

/** Redirect target when session is missing or slug mismatches. */
export function sessionLoginPath(restaurantSlug: string): string {
  const slug = restaurantSlug.trim();
  if (!slug || slug === getDefaultRestaurantSlug()) return "/";
  return `/r/${encodeURIComponent(slug)}`;
}
