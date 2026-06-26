"use client";

import { getDefaultRestaurantSlug } from "@/lib/restaurant-demo";

export interface AppSession {
  name: string;
  tableNumber: string;
  role: "cliente";
  restaurantSlug: string;
  createdAt: string;
}

const KEY = "ordee_mvp_session";

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

export function getSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const session = normalizeSession(parsed);
    if (!session) return null;
    return isValidSession(session) ? session : session;
  } catch {
    return null;
  }
}

export function getSessionForSlug(restaurantSlug: string): AppSession | null {
  const session = getSession();
  if (!session) return null;
  if (session.restaurantSlug !== restaurantSlug.trim()) return null;
  return session;
}

export function setSession(session: AppSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem("ordee_table");
}

/** Redirect target when session is missing or slug mismatches. */
export function sessionLoginPath(restaurantSlug: string): string {
  const slug = restaurantSlug.trim();
  if (!slug || slug === getDefaultRestaurantSlug()) return "/";
  return `/r/${encodeURIComponent(slug)}`;
}
