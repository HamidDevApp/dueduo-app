"use client";

import { useId, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { whatsappUrl } from "@/lib/scripts";

type Props = {
  label: string;
  title: string;
  text: string;
  tip?: string;
};

/** Opens a ready-to-send, editable WhatsApp message in a modal. */
export function ScriptSheet({ label, title, text, tip }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState(text);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-strong hover:bg-brand/15"
      >
        <MessageCircle className="size-4" aria-hidden />
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[var(--radius-card)] bg-surface p-0 text-ink shadow-xl backdrop:bg-ink/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close(); // click on backdrop
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Boundary script</p>
              <h2 id={titleId} className="mt-1 font-display text-2xl">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium">Edit anything before sending</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-1.5 w-full resize-y rounded-xl border border-line bg-canvas px-4 py-3 text-base leading-relaxed outline-none focus:border-brand"
            />
          </label>

          {tip && <p className="mt-3 rounded-xl bg-sage-soft p-3 text-sm text-ink">💡 {tip}</p>}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a
              href={whatsappUrl(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              <MessageCircle className="size-4" aria-hidden /> Open in WhatsApp
            </a>
            <CopyButton value={message} label="Copy text" />
          </div>
        </div>
      </dialog>
    </>
  );
}
