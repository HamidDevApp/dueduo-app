"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Text with optional links: external links open in a new tab. */
export type Segment = string | { text: string; href: string };
/** A plain item, or a list of segments (some of them links). */
export type ChecklistItem = string | Segment[];
export type ChecklistGroup = { id: string; title: string; items: ChecklistItem[] };

const segText = (s: Segment) => (typeof s === "string" ? s : s.text);
const itemText = (i: ChecklistItem) => (typeof i === "string" ? i : i.map(segText).join(""));

export function Segments({ parts }: { parts: Segment[] }) {
  return (
    <>
      {parts.map((p, n) =>
        typeof p === "string" ? (
          p
        ) : (
          <a
            key={n}
            href={p.href}
            {...(p.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-brand-strong underline underline-offset-2 print:font-normal print:text-ink print:no-underline"
          >
            {p.text}
          </a>
        ),
      )}
    </>
  );
}

const LAYOUTS = {
  /** Up to 3 cards side by side (hospital bags). */
  columns: "grid gap-5 lg:grid-cols-3 print:grid-cols-3 print:gap-5",
  /** Many small groups (stages): 2 columns on wider screens, flowing 2 columns on paper. */
  stages: "grid gap-4 md:grid-cols-2 print:block print:columns-2 print:gap-6",
};

/** Tick-off checklists: clickable on screen, nothing is saved; prints as empty boxes. */
export function Checklist({
  groups,
  layout = "columns",
  headingLevel = 2,
}: {
  groups: ChecklistGroup[];
  layout?: keyof typeof LAYOUTS;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className={LAYOUTS[layout]}>
      {groups.map((g) => (
        <section
          key={g.id}
          className={cn(
            "break-inside-avoid rounded-[var(--radius-card)] border border-line bg-surface p-6 print:rounded-none print:border-0 print:bg-transparent print:p-0",
            layout === "stages" && "p-5 print:mb-3",
          )}
        >
          <Heading
            className={cn(
              "font-display font-semibold",
              layout === "stages" ? "text-lg print:text-[10.5pt]" : "text-xl print:text-base",
            )}
          >
            {g.title}
          </Heading>
          <ul className={cn("mt-4 space-y-3 print:mt-2 print:space-y-1.5", layout === "stages" && "mt-3 print:mt-1 print:space-y-1")}>
            {g.items.map((item) => {
              const key = `${g.id}:${itemText(item)}`;
              const checked = done.has(key);
              return (
                <li
                  key={key}
                  className={cn(
                    "flex items-start gap-3 leading-snug print:gap-2",
                    layout === "stages" ? "print:text-[9.5pt]" : "print:text-[10.5pt]",
                  )}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={itemText(item)}
                    onClick={() => toggle(key)}
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none print:size-3.5 print:rounded-sm print:border",
                      checked ? "border-brand-strong bg-brand-strong text-white" : "border-ink/25 bg-surface text-transparent",
                      "print:border-ink/60 print:bg-transparent print:text-transparent",
                    )}
                  >
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </button>
                  <span
                    onClick={() => toggle(key)}
                    className={cn("cursor-pointer", checked && "text-muted line-through print:text-ink print:no-underline")}
                  >
                    {typeof item === "string" ? item : <Segments parts={item} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
