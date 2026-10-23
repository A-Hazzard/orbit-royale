import type { Metadata, Viewport } from "next";
import {
  Bungee, Outfit, Orbitron, Playfair_Display, Lora, Cinzel, Limelight, Alfa_Slab_One, Courier_Prime,
} from "next/font/google";
import "./globals.css";

const display = Bungee({ weight: "400", variable: "--font-display", subsets: ["latin"] });
const sans = Outfit({ variable: "--font-sans", subsets: ["latin"] });
const digital = Orbitron({ variable: "--font-digital", subsets: ["latin"], weight: ["700", "900"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["700", "900"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["700", "900"] });
const limelight = Limelight({ variable: "--font-limelight", subsets: ["latin"], weight: "400" });
const alfa = Alfa_Slab_One({ variable: "--font-alfa", subsets: ["latin"], weight: "400" });
const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"] });
const fonts = [display, sans, digital, playfair, lora, cinzel, limelight, alfa, courier].map((f) => f.variable).join(" ");

// Sets the saved/linked template before first paint so there is no flash of the default theme.
const themeInit = `try{var q=new URLSearchParams(location.search).get("theme")||localStorage.getItem("whe-theme");if(q)document.documentElement.dataset.theme=q}catch(e){}`;

export const metadata: Metadata = {
  title: "Whe King — Pick your lucky number",
  description: "Prototype: a Play Whe style lucky-number game with base + attach bets.",
};

export const viewport: Viewport = { themeColor: "#07060f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={fonts}>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>{children}</body>
    </html>
  );
}
