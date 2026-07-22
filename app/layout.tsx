import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NESED — Every car. Every lease. One search.",
  description: "Compare live purchase and lease offers from trusted automotive marketplaces in one search.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
