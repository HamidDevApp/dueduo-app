import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import {
  BeforeAfter,
  CoPilotSpotlight,
  Faq,
  FeaturesBento,
  FinalCta,
  Hero,
  HowItWorks,
  NumbersStrip,
  Pricing,
  SiteFooter,
} from "@/components/landing/sections";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description:
    "DueDuo is the week-by-week command center for first-time parents: roadmap, appointments, doctor questions, budget, registry and hospital bags — with Co-Pilot mode for your partner. One-time $29.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Your first pregnancy, planned for two.",
    description: "The week-by-week pregnancy command center for you and your partner. One-time $29.",
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// Fully static: instant loads from ads, great for SEO.
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <NumbersStrip />
        <BeforeAfter />
        <CoPilotSpotlight />
        <FeaturesBento />
        <HowItWorks />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
