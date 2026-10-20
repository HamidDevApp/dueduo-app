import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { Guide, Source } from "@/lib/guides";
import { CheckoutLink } from "@/components/checkout-link";
import { PackSignup } from "@/components/guides/pack-signup";
import { AUTHOR, guideJsonLd, guideSource } from "@/lib/guides";
import { formatLongDate } from "@/lib/utils";
import { SITE } from "@/lib/site-config";

/** Breadcrumb, H1 and structured data shared by every guide/tool page. */
export function GuideHeader({ guide, children }: { guide: Guide; children?: React.ReactNode }) {
  return (
    <header>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd(guide)).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted print:hidden">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-ink">{SITE.name}</Link></li>
          <li aria-hidden><ChevronRight className="size-3.5" /></li>
          <li><Link href="/guides" className="hover:text-ink">Free guides</Link></li>
        </ol>
      </nav>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl print:mt-0 print:text-2xl">
        {guide.h1}
      </h1>
      <p className="mt-4 text-sm text-muted print:hidden">
        By{" "}
        <Link href={AUTHOR.path} className="font-semibold text-ink hover:text-brand-strong">
          {AUTHOR.name}
        </Link>
        , {AUTHOR.role} · Last updated {formatLongDate(guide.updated ?? guide.published)}
      </p>
      {children}
    </header>
  );
}

/** Body copy wrapper: readable measure, Rose Deep links. */
export function Prose({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`space-y-4 text-lg leading-relaxed text-ink/85 [&_a]:font-semibold [&_a]:text-brand-strong [&_a]:underline [&_a]:underline-offset-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function SourceLink({ source, children }: { source: Source; children: React.ReactNode }) {
  return (
    <a href={source.url} target="_blank" rel="noopener">
      {children}
    </a>
  );
}

export function Sources({ sources }: { sources: Source[] }) {
  return (
    <section className="mt-14 border-t border-line pt-8 print:hidden">
      <h2 className="font-display text-xl font-semibold">Sources</h2>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
        {sources.map((s) => (
          <li key={s.n}>
            <a href={s.url} target="_blank" rel="noopener" className="text-brand-strong underline-offset-2 hover:underline">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "DueDuo box" text (per page) + the shared approved CTA. Hidden when printing. */
export function GuideCta({ guide, children }: { guide: Guide; children: React.ReactNode }) {
  const smallPrint = [
    "One-time payment",
    "No subscription",
    "Your partner joins free",
    ...(SITE.guaranteeDays ? [`${SITE.guaranteeDays}-day money-back guarantee`] : []),
  ];
  return (
    <>
    <PackSignup source={guideSource(guide)} />
    <aside className="mt-14 rounded-[var(--radius-card)] border border-brand/20 bg-brand-soft/60 p-6 sm:p-8 print:hidden">
      <p className="leading-relaxed text-ink/85">{children}</p>
      <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight">Plan it together in {SITE.name}</h2>
      <p className="mt-2 leading-relaxed text-ink/85">
        A week-by-week plan for both of you, with your own task lists, shared checklists, one-page appointment printouts
        and a baby budget.
      </p>
      <CheckoutLink
        from={guideSource(guide)}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-strong px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-strong/20 hover:bg-brand-deep"
      >
        Start our plan — {SITE.price}
      </CheckoutLink>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {smallPrint.map((t) => (
          <li key={t} className="flex items-center gap-1">
            <Check className="size-3.5 text-sage" aria-hidden /> {t}
          </li>
        ))}
      </ul>
    </aside>
    </>
  );
}
