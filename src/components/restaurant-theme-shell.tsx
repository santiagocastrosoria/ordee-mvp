"use client";

import type { ThemeTokens } from "@/lib/theme";
import { themeToCssVars } from "@/lib/theme";

interface RestaurantThemeShellProps {
  theme: ThemeTokens | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * Applies per-restaurant CSS variables on menu routes only.
 * Checkout/cart/layout stay on the global default theme.
 */
export function RestaurantThemeShell({ theme, children, className = "" }: RestaurantThemeShellProps) {
  return (
    <div className={`min-h-full bg-brand-bg text-brand-ink ${className}`.trim()} style={themeToCssVars(theme)}>
      {children}
    </div>
  );
}
