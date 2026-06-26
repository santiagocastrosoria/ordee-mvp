"use client";

import { useEffect } from "react";
import { themeToCssVars, type ThemeTokens } from "@/lib/theme";

const THEME_VAR_KEYS = [
  "--ordee-bg",
  "--ordee-card",
  "--ordee-soft",
  "--ordee-border",
  "--ordee-muted",
  "--ordee-ink",
  "--ordee-accent",
  "--ordee-accent-fg"
] as const;

const DEFAULT_VARS = themeToCssVars(null);

interface RestaurantThemeProviderProps {
  slug: string;
  theme: ThemeTokens | null;
  children: React.ReactNode;
}

/**
 * Applies per-restaurant CSS variables on documentElement for full-page theming.
 * Covers TopNav, body background, and all customer routes under /r/[slug].
 */
export function RestaurantThemeProvider({ slug, theme, children }: RestaurantThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    const vars = themeToCssVars(theme);
    const previous: Record<string, string> = {};

    for (const key of THEME_VAR_KEYS) {
      previous[key] = root.style.getPropertyValue(key);
      const value = vars[key];
      if (value) root.style.setProperty(key, value);
    }

    root.setAttribute("data-restaurant-theme", slug);

    return () => {
      for (const key of THEME_VAR_KEYS) {
        const fallback = DEFAULT_VARS[key];
        if (fallback) root.style.setProperty(key, fallback);
        else root.style.removeProperty(key);
      }
      root.removeAttribute("data-restaurant-theme");
    };
  }, [slug, theme]);

  return <>{children}</>;
}
