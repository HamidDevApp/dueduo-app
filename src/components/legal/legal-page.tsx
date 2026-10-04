import { SITE } from "@/lib/site-config";
import { formatLongDate } from "@/lib/utils";

export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-xs font-semibold tracking-[0.18em] text-brand-strong uppercase">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">Last updated: {formatLongDate(SITE.legal.lastUpdated)}</p>
      {intro && <p className="mt-8 text-lg leading-relaxed text-ink/80">{intro}</p>}
      <div className="mt-10 space-y-10">{children}</div>
    </article>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink/80 [&_a]:font-semibold [&_a]:text-brand-strong [&_a]:underline-offset-2 hover:[&_a]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
