"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ready-to-copy messages with a due-month picker.
 * The picked month lives only in React state: no storage, cookies, URL params or analytics.
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const PLACEHOLDER = "[month]";

const MonthContext = createContext<{ month: string; setMonth: (m: string) => void }>({ month: "", setMonth: () => {} });

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [month, setMonth] = useState("");
  return <MonthContext.Provider value={{ month, setMonth }}>{children}</MonthContext.Provider>;
}

export function MonthPicker() {
  const { month, setMonth } = useContext(MonthContext);
  const id = useId();
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <label htmlFor={id} className="text-sm font-semibold">
        Your due month
      </label>
      <select
        id={id}
        aria-describedby={`${id}-help`}
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-brand sm:max-w-xs"
      >
        <option value="">Pick a month</option>
        {MONTHS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <p id={`${id}-help`} className="mt-1.5 text-xs text-muted">
        Fills in [month] in every message. Nothing is saved.
      </p>
    </div>
  );
}

export function MessageCard({ text, tip }: { text: string; tip?: string }) {
  const { month } = useContext(MonthContext);
  const [copied, setCopied] = useState(false);
  const body = useRef<HTMLParagraphElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const filled = month ? text.split(PLACEHOLDER).join(month) : text;
  // Any "[something]" is a blank to fill in; only [month] is filled automatically.
  const parts = text.split(/(\[[a-z ]+\])/i);

  async function copy() {
    try {
      await navigator.clipboard.writeText(filled);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access: select the text so it can be copied by hand.
      const sel = window.getSelection();
      if (body.current && sel) {
        const range = document.createRange();
        range.selectNodeContents(body.current);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  const button =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="mt-4">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p ref={body} className="text-lg leading-relaxed">
          {parts.map((p, n) =>
            p === PLACEHOLDER && month ? (
              <span key={n}>{month}</span>
            ) : /^\[[a-z ]+\]$/i.test(p) ? (
              <mark key={n} className="rounded bg-honey/40 px-1 text-ink">
                {p}
              </mark>
            ) : (
              <span key={n} className="whitespace-pre-line">{p}</span>
            ),
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={cn(button, "border border-line bg-canvas text-ink hover:bg-brand-soft")}>
            {copied ? <Check className="size-4 text-sage" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(filled)}`}
            target="_blank"
            rel="noopener"
            className={cn(button, "bg-brand-strong text-white hover:bg-brand-deep")}
          >
            <MessageCircle className="size-4" aria-hidden /> Send on WhatsApp
          </a>
        </div>
      </div>
      {tip && <p className="mt-2 px-1 text-sm text-muted">{tip}</p>}
    </div>
  );
}
