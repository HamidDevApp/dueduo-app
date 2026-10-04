import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { Pixels } from "@/components/tracking/pixels";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: {
    default: "DueDuo — the first pregnancy planner for two",
    template: "%s · DueDuo",
  },
  description:
    "DueDuo: the week-by-week command center for first-time parents — roadmap, appointments, doctor questions, budget, registry and hospital bag.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#faf6f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh">
        {children}
        <ConsentBanner />
        <Pixels />
        {/* Cookieless visit statistics — no consent needed. Enable "Web Analytics" in your Vercel project. */}
        <Analytics />
      </body>
    </html>
  );
}
