import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { getAllSettings, s } from "@/lib/content/queries";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getAllSettings();
  return {
    metadataBase: new URL(env.APP_URL),
    title: { default: s(seo, "defaultTitle"), template: s(seo, "titleTemplate") || "%s · PETROLUB" },
    description: s(seo, "defaultDescription"),
    applicationName: "PETROLUB",
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

/** Darkens a hex colour for accessible accent text on light backgrounds. */
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { general } = await getAllSettings();
  const accent = /^#[0-9a-f]{6}$/i.test(s(general, "accentColor")) ? s(general, "accentColor") : "#1c782b";
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable}`} style={{ ["--brand-accent" as string]: accent, ["--brand-accent-ink" as string]: shade(accent, 0.62) }}>
      <body>{children}</body>
    </html>
  );
}
