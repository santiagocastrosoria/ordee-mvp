import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#fafafa",
          card: "#ffffff",
          soft: "#f4f4f5",
          border: "#e4e4e7",
          muted: "#71717a",
          ink: "#0a0a0a",
          /** CTAs y acento principal (menú / nav nuevos) */
          accent: "#0a0a0a",
          accentFg: "#fafafa",
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
