import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PlanForTwo } from "@/components/guides/plan-for-two";
import { Prose } from "@/components/guides/guide-parts";
import { AUTHOR, GUIDES, guideJsonLd, guideMetadata, type Guide } from "@/lib/guides";
import { PLAN_COPY } from "@/lib/plan";
import { SITE } from "@/lib/site-config";
import { formatLongDate } from "@/lib/utils";

const guide: Guide = GUIDES.plan;

export const metadata: Metadata = guideMetadata(guide);

export default function PlanPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <header>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd(guide)).replace(/</g, "\\u003c") }}
        />
        <nav aria-label="Breadcrumb" className="text-sm text-muted print:hidden">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-ink">
                {SITE.name}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <Link href="/guides" className="hover:text-ink">
                Free guides
              </Link>
            </li>
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
      </header>

      <Prose className="mt-6">
        <p>{PLAN_COPY.lede}</p>
      </Prose>

      <div className="mt-10">
        <PlanForTwo />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">How we work out your week</h2>
        <Prose className="mt-3">
          <p>
            Pregnancy is counted from the first day of your last period, so a due date is 40 weeks, or 280 days, after
            that. If you know your due date instead, we count back 280 days to find where you are now.
          </p>
          <p>The plan shows this week plus the next three, so you can see what is coming, not only what is due now.</p>
        </Prose>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Why split it three ways</h2>
        <Prose className="mt-3">
          <p>
            Some things are yours to decide and do. Some fit your partner better, like the practical jobs or the
            questions to ask at appointments. And some are worth doing together, so you both know the same things and
            nobody has to remember it all.
          </p>
        </Prose>
      </section>
    </article>
  );
}
