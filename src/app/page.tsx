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

// Structured data for search engines. Planning tool only: no ratings, reviews or medical claims.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/brand/dueduo-icon-512.png`,
      sameAs: SITE.social.map((s) => s.url),
    },
    {
      "@type": "WebApplication",
      name: SITE.name,
      url: SITE.url,
      description:
        "A week-by-week pregnancy planner for first-time parents and their partner: roadmap, appointments, doctor questions, budget, registry and hospital bag.",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      publisher: { "@id": `${SITE.url}/#organization` },
      offers: {
        "@type": "Offer",
        price: SITE.priceValue,
        priceCurrency: SITE.currency,
      },
    },
  ],
};

// Fully static: instant loads from ads, great for SEO.
export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
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
