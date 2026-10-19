import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GUIDE_LIST } from "@/lib/guides";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: { absolute: `Free guides and tools for planning for two | ${SITE.name}` },
  description:
    "Free, printable guides and tools for first-time parents: hospital bag checklist, appointment questions, a parental leave calculator, the partner's to-do list and more.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Free guides and tools for planning for two
      </h1>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {GUIDE_LIST.map((g) => (
          <li key={g.path}>
            <Link
              href={g.path}
              className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-ink/5"
            >
              <span className="text-xs font-semibold tracking-[0.18em] text-sage uppercase">{g.kind}</span>
              <span className="mt-3 font-display text-xl font-semibold">{g.cardTitle ?? g.h1}</span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{g.blurb}</span>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">
                {g.kind === "Tool" ? "Open the calculator" : "Read the guide"}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
