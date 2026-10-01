"use client";

import { useOptimistic, useTransition } from "react";
import { Plus } from "lucide-react";
import { addSuggestedQuestion } from "@/app/(app)/questions/actions";

export function QuestionIdeas({ ideas }: { ideas: string[] }) {
  const [, startTransition] = useTransition();
  const [added, markAdded] = useOptimistic<string[], string>([], (prev, q) => [...prev, q]);
  const visible = ideas.filter((i) => !added.includes(i));

  if (visible.length === 0) return <p className="text-sm text-muted">All ideas for this trimester are on your list.</p>;

  return (
    <ul className="flex flex-wrap gap-2">
      {visible.map((idea) => (
        <li key={idea}>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                markAdded(idea);
                await addSuggestedQuestion(idea);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-left text-sm hover:border-brand hover:bg-brand-soft/40"
          >
            <Plus className="size-3.5 shrink-0 text-brand" aria-hidden /> {idea}
          </button>
        </li>
      ))}
    </ul>
  );
}
