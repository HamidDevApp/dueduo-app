import { Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = { title: string; done?: boolean; owner: "You" | "Jack" | "Both" };

const TASKS: Task[] = [
  { title: "Book the anatomy scan", owner: "Jack", done: true },
  { title: "File leave paperwork", owner: "You" },
  { title: "Ask for hand-me-downs", owner: "Jack" },
  { title: "Compare birth centers", owner: "Both" },
];

const CHIP: Record<Task["owner"], string> = {
  You: "bg-brand-soft text-brand-strong",
  Jack: "bg-sage-soft text-[#4f6b59]",
  Both: "bg-canvas text-ink",
};

function Device({ who, role, highlight, className }: { who: string; role: string; highlight: Task["owner"]; className?: string }) {
  return (
    <div className={cn("w-[228px] rounded-[2rem] sm:w-[260px] border border-ink/10 bg-white p-2 shadow-2xl shadow-ink/10", className)}>
      <div className="rounded-[1.6rem] bg-canvas/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{role}</p>
            <p className="font-display text-lg leading-tight">{who}</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">Week 20</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full w-1/2 rounded-full bg-brand-strong" />
        </div>
        <p className="mt-4 text-[11px] font-semibold text-muted">This week · Halfway there</p>
        <ul className="mt-2 space-y-1.5">
          {TASKS.map((t) => (
            <li
              key={t.title}
              className={cn(
                "flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[12px] shadow-sm",
                t.owner !== highlight && t.owner !== "Both" && "opacity-55",
              )}
            >
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border",
                  t.done ? "border-sage bg-sage text-white" : "border-ink/20",
                )}
              >
                {t.done && <Check className="size-2.5" strokeWidth={3.5} />}
              </span>
              <span className={cn("min-w-0 flex-1 truncate", t.done && "text-muted line-through")}>{t.title}</span>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", CHIP[t.owner])}>{t.owner}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Illustrative mock (no real data): the same plan on two phones, kept in sync. */
export function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto h-[470px] w-full max-w-[520px] select-none sm:h-[480px]">
      <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(192,97,90,0.18),transparent)] blur-2xl" />
      <Device who="Emma" role="You" highlight="You" className="absolute top-0 left-0 -rotate-3 sm:left-2" />
      <Device who="Jack" role="Co-Pilot" highlight="Jack" className="absolute right-0 bottom-12 rotate-3 sm:right-2 sm:bottom-0" />
      <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-canvas shadow-xl sm:bottom-16 sm:left-8 sm:translate-x-0">
        <RefreshCw className="size-3.5" /> Synced on both phones
      </div>
    </div>
  );
}
