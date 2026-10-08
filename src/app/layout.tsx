import type { Metadata, Viewport } from "next";
import { Caprasimo, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CartSync } from "@/components/CartSync";
import { ToastHost } from "@/components/ToastHost";

// Caprasimo = display serif (headlines, masthead) — the retro chunky face the
// Figma template uses for "Our Blooms". Outfit = geometric sans for UI/body.
const caprasimo = Caprasimo({
  weight: "400",
  variable: "--font-caprasimo",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Green Gazette™ — Plants, Delivered",
  description:
    "The Green Gazette™ is a plant shop for indoor plants, ferns, succulents and trees — every plant comes with expert care notes and is delivered across Nigeria.",
  keywords: [
    "plants",
    "houseplants",
    "plant shop",
    "indoor plants",
    "succulents",
    "plant delivery",
    "Nigeria",
    "The Green Gazette",
  ],
  icons: {
    // Canonical logo file: src/app/icon.svg (the exact mark in the navbar).
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    // iOS ignores SVG touch icons — apple-icon.png is generated from the same
    // canonical file by scripts/generate-icons.mjs.
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c2825",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caprasimo.variable} ${outfit.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-white text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <CartSync />
        <ToastHost />
      </body>
    </html>
  );
}
