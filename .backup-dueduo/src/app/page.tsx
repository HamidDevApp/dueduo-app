import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/site-header";
import {
  CoPilotBand,
  Faq,
  Features,
  FinalCta,
  Hero,
  HowItWorks,
  Pricing,
  Problem,
  SiteFooter,
} from "@/components/landing/sections";

export const metadata: Metadata = {
  title: { absolute: "First Pregnancy Planner — know exactly what happens next" },
  description:
    "Pregnant for the first time? A week-by-week command center for you and your partner: roadmap, appointments, doctor questions, budget, registry and hospital bag. One-time $29.",
  openGraph: {
    title: "Pregnant for the first time? Here's exactly what happens next.",
    description: "The week-by-week pregnancy command center for you and your partner.",
    type: "website",
  },
};

// Fully static: fast to load from ads, great for SEO.
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <CoPilotBand />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
