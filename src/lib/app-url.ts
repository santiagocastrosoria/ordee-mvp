/**
 * Returns the public base URL of the app — origin only, no trailing slash, no path.
 * Handles cases where the env var accidentally includes a path (e.g. https://app.vercel.app/menu).
 */
export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (!raw) return "http://localhost:3000";

  const trimmed = String(raw).trim().replace(/\/$/, "");
  const full = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(full);
    // Always return only origin — strip any accidental path (e.g. /menu)
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}
