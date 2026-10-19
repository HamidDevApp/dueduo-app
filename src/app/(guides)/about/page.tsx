import type { Metadata } from "next";
import { AUTHOR } from "@/lib/guides";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: { absolute: `About ${SITE.name}` },
  description: `Why ${SITE.name} exists, who builds it, and how we write our free guides.`,
  alternates: { canonical: "/about" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${SITE.url}/about`,
  mainEntity: {
    "@type": "Person",
    name: AUTHOR.name,
    jobTitle: "Founder",
    worksFor: { "@type": "Organization", "@id": `${SITE.url}/#organization`, name: SITE.name, url: SITE.url },
  },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="text-xs font-semibold tracking-[0.18em] text-brand-strong uppercase">About {SITE.name}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Why we built DueDuo</h1>

      <blockquote className="mt-10 rounded-[var(--radius-card)] border-l-4 border-brand-strong bg-surface p-6 sm:p-8">
        <p className="font-display text-xl leading-relaxed sm:text-2xl">
          &ldquo;I built DueDuo because I realized that during pregnancy, the mental load of researching, planning, and
          organizing almost always falls on one person. I wanted to create a simple, shared tool that helps expecting
          couples split the tasks, plan together, and step into parenthood as a true team.&rdquo;
        </p>
        <footer className="mt-5 text-sm font-semibold text-muted">{AUTHOR.name}, founder</footer>
      </blockquote>

      <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">How we write our guides</h2>
      <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink/85">
        <p>
          Our guides are about planning: checklists, budgets, messages and who does what. They are not medical advice. For
          anything about your health or your baby&apos;s, your doctor or midwife knows best.
        </p>
        <p>
          Every fact comes from a trusted source, such as the American Academy of Pediatrics, ACOG, the CDC or government
          sites, and is linked at the bottom of each guide.
        </p>
        <p>We check every guide before it goes live and update it when the rules change.</p>
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">Contact</h2>
      <p className="mt-4 text-lg text-ink/85">
        <a
          href={`mailto:${SITE.supportEmail}`}
          className="font-semibold text-brand-strong underline underline-offset-2"
        >
          {SITE.supportEmail}
        </a>
      </p>
    </article>
  );
}
