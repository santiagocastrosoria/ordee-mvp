/** Per-restaurant theme tokens stored in restaurants.theme (jsonb). */
export type ThemeTokens = {
  bg: string;
  card: string;
  soft: string;
  border: string;
  muted: string;
  ink: string;
  accent: string;
  accentFg: string;
};

export const DEFAULT_THEME: ThemeTokens = {
  bg: "#fafafa",
  card: "#ffffff",
  soft: "#f4f4f5",
  border: "#e4e4e7",
  muted: "#71717a",
  ink: "#0a0a0a",
  accent: "#0a0a0a",
  accentFg: "#fafafa"
};

/** Clarke's Irish pub burgundy palette. */
export const CLARKES_THEME: ThemeTokens = {
  bg: "#2a0a12",
  card: "#3d1520",
  soft: "#4a1a28",
  border: "#5c2433",
  muted: "#c4a0a8",
  ink: "#faf5f0",
  accent: "#8b1a2d",
  accentFg: "#ffffff"
};

function hexToRgbChannels(hex: string): string | null {
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function parseThemeTokens(raw: unknown): ThemeTokens | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const keys: (keyof ThemeTokens)[] = ["bg", "card", "soft", "border", "muted", "ink", "accent", "accentFg"];
  for (const k of keys) {
    if (typeof o[k] !== "string" || !String(o[k]).trim()) return null;
  }
  return o as ThemeTokens;
}

/** CSS variables as RGB channels for Tailwind opacity modifiers. */
export function themeToCssVars(theme: ThemeTokens | null): Record<string, string> {
  const t = theme ?? DEFAULT_THEME;
  const entries: [string, string][] = [
    ["--ordee-bg", t.bg],
    ["--ordee-card", t.card],
    ["--ordee-soft", t.soft],
    ["--ordee-border", t.border],
    ["--ordee-muted", t.muted],
    ["--ordee-ink", t.ink],
    ["--ordee-accent", t.accent],
    ["--ordee-accent-fg", t.accentFg]
  ];

  const vars: Record<string, string> = {};
  for (const [key, hex] of entries) {
    const channels = hexToRgbChannels(hex);
    if (channels) vars[key] = channels;
  }
  return vars;
}
