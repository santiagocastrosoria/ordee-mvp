export const TEMP_PASSWORD = "123456789";

export function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email.trim());
}

export function nameFromEmail(email: string): string {
  const base = email.split("@")[0] ?? "Cliente";
  const normalized = base.replace(/[._-]+/g, " ").trim();
  if (!normalized) return "Cliente";
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
