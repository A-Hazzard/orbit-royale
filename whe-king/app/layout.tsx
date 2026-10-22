import type { Metadata, Viewport } from "next";
import { Bungee, Outfit, Orbitron } from "next/font/google";
import "./globals.css";

const display = Bungee({ weight: "400", variable: "--font-display", subsets: ["latin"] });
const sans = Outfit({ variable: "--font-sans", subsets: ["latin"] });
const digital = Orbitron({ variable: "--font-digital", subsets: ["latin"], weight: ["700", "900"] });

export const metadata: Metadata = {
  title: "Whe King — Pick your lucky number",
  description: "Prototype: a Play Whe style lucky-number game with base + attach bets.",
};

export const viewport: Viewport = { themeColor: "#07060f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${digital.variable}`}>
      <body>{children}</body>
    </html>
  );
}
