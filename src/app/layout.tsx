import type { Metadata } from "next";
import "./globals.css";
import { HelpButton } from "@/components/help-button";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "ORDEE MVP",
  description: "Menu digital y cocina en tiempo real",
  icons: {
    icon: "/favicon.ico?v=2",
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-icon.png?v=2"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <TopNav />
        <HelpButton />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
