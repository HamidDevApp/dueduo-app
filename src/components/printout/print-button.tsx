"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-strong px-5 py-3 text-sm font-semibold text-white hover:bg-brand-deep"
    >
      <Printer className="size-4" aria-hidden /> Print or save as PDF
    </button>
  );
}
