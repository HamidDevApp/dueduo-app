"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** A plain item, or one whose `linkText` part links to a source. */
export type ChecklistItem = string | { text: string; linkText: string; href: string };
export type ChecklistGroup = { id: string; title: string; items: ChecklistItem[] };

const itemText = (i: ChecklistItem) => (typeof i === "string" ? i : i.text);

function ItemLabel({ item }: { item: ChecklistItem }) {
  if (typeof item === "string") return <>{item}</>;
  const [before, after] = item.text.split(item.linkText);
  return (
    <>
      {before}
      <a
        href={item.href}
        target="_blank"
        rel="noopener"
        onClick={(e) => e.stopPropagation()}
        className="font-semibold text-brand-strong underline underline-offset-2 print:font-normal print:text-ink print:no-underline"
      >
        {item.linkText}
      </a>
      {after}
    </>
  );
}

/** Tick-off checklists: clickable on screen, nothing is saved; prints as empty boxes. */
export function Checklist({ groups }: { groups: ChecklistGroup[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="grid gap-5 lg:grid-cols-3 print:grid-cols-3 print:gap-5">
      {groups.map((g) => (
        <section
          key={g.id}
          className="break-inside-avoid rounded-[var(--radius-card)] border border-line bg-surface p-6 print:rounded-none print:border-0 print:bg-transparent print:p-0"
        >
          <h2 className="font-display text-xl font-semibold print:text-base">{g.title}</h2>
          <ul className="mt-4 space-y-3 print:mt-2 print:space-y-1.5">
            {g.items.map((item) => {
              const key = `${g.id}:${itemText(item)}`;
              const checked = done.has(key);
              return (
                <li key={key} className="flex items-start gap-3 leading-snug print:gap-2 print:text-[10.5pt]">
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
                    <ItemLabel item={item} />
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
