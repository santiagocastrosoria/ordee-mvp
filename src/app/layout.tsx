import type { Metadata } from "next";
import "./globals.css";
import { CustomerMain } from "@/components/customer-main";
import { HelpButton } from "@/components/help-button";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "ORDEE MVP",
  description: "Menu digital y cocina en tiempo real",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/icon.png?v=4", type: "image/png", sizes: "32x32" },
      { url: "/icon.png?v=4", type: "image/png", sizes: "192x192" }
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/apple-touch-icon.png?v=4"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <TopNav />
        <HelpButton />
        <CustomerMain>{children}</CustomerMain>
      </body>
    </html>
  );
}
