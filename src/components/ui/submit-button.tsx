"use client";

import { useFormStatus } from "react-dom";

/** Form submit button that disables itself while the action runs, so a double tap can't submit twice. */
export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
