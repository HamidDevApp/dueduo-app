"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTaskDone } from "@/app/(app)/roadmap/actions";

/** Ticks a roadmap task exactly like the This week page does, then refreshes Today. */
export function MarkDoneButton({ taskKey }: { taskKey: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await setTaskDone(taskKey, true);
            if (res.ok) router.refresh();
            else setError(res.error);
          })
        }
        className="inline-flex items-center justify-center rounded-xl bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-70"
      >
        Mark done
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-brand-strong">
          {error}
        </p>
      )}
    </>
  );
}
