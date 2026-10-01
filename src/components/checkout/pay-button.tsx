"use client";

import { useFormStatus } from "react-dom";
import { Lock } from "lucide-react";

export function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 text-base font-semibold text-white shadow-sm hover:bg-brand-strong disabled:opacity-70"
    >
      <Lock className="size-4" aria-hidden />
      {pending ? "Opening secure checkout…" : label}
    </button>
  );
}
