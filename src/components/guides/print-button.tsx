"use client";

import { Printer } from "lucide-react";

export function GuidePrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-strong px-6 py-3.5 font-semibold text-white hover:bg-brand-deep print:hidden"
    >
      <Printer className="size-4" aria-hidden /> {children}
    </button>
  );
}
