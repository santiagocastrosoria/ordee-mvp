import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "rgb(var(--ordee-bg) / <alpha-value>)",
          card: "rgb(var(--ordee-card) / <alpha-value>)",
          soft: "rgb(var(--ordee-soft) / <alpha-value>)",
          border: "rgb(var(--ordee-border) / <alpha-value>)",
          muted: "rgb(var(--ordee-muted) / <alpha-value>)",
          ink: "rgb(var(--ordee-ink) / <alpha-value>)",
          /** CTAs y acento principal (menú / nav nuevos) */
          accent: "rgb(var(--ordee-accent) / <alpha-value>)",
          accentFg: "rgb(var(--ordee-accent-fg) / <alpha-value>)",
          /** Legacy: otras pantallas siguen usando `brand-gold` hasta migrarlas */
          gold: "#d7ae66"
        }
      },
      boxShadow: {
        "brand-sm": "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)"
      },
      transitionDuration: {
        tap: "150ms"
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.33, 1, 0.68, 1)"
      }
    }
  },
  plugins: []
};

export default config;
