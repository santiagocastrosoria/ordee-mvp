"use client";

export interface AppSession {
  name: string;
  tableNumber: string;
  role: "cliente";
  createdAt: string;
}

const KEY = "ordee_mvp_session";

function isValidSession(value: unknown): value is AppSession {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    o.name.trim() !== "" &&
    typeof o.tableNumber === "string" &&
    o.tableNumber.trim() !== "" &&
    o.role === "cliente" &&
    typeof o.createdAt === "string"
  );
}

export function getSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
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
