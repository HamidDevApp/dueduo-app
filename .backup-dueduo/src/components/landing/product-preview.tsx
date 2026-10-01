import { CalendarHeart, Check, HeartHandshake, Luggage, Sparkles } from "lucide-react";

/** A static, illustrative mock of the dashboard — no real user data. */
export function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-soft via-canvas to-sage-soft blur-2xl" />
      <div className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-xl shadow-ink/5">
        <div className="rounded-2xl border border-line p-4">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-strong">
            <Sparkles className="size-3" /> Trimester 2
          </p>
          <div className="mt-2 flex items-end justify-between">
            <p className="font-display text-4xl">Week 20</p>
            <p className="text-right">
              <span className="block font-display text-2xl text-brand">140</span>
              <span className="text-xs text-muted">days to go</span>
            </p>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-canvas">
            <div className="h-full w-1/2 rounded-full bg-brand" />
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-muted">This week · Halfway there</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="grid size-4.5 place-items-center rounded-full bg-sage text-white"><Check className="size-3" strokeWidth={3} /></span>
              <span className="text-muted line-through">Book the anatomy scan</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-4.5 rounded-full border-2 border-line" />
              File leave paperwork
              <span className="ml-auto rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand-strong">You</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-4.5 rounded-full border-2 border-line" />
              Ask for hand-me-downs
              <span className="ml-auto rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-semibold text-sage">Partner</span>
            </li>
          </ul>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl bg-canvas p-2.5">
            <CalendarHeart className="mx-auto size-4 text-brand" />
            <p className="mt-1 font-semibold">Scan Fri</p>
          </div>
          <div className="rounded-xl bg-canvas p-2.5">
            <HeartHandshake className="mx-auto size-4 text-brand" />
            <p className="mt-1 font-semibold">Co-Pilot on</p>
          </div>
          <div className="rounded-xl bg-canvas p-2.5">
            <Luggage className="mx-auto size-4 text-brand" />
            <p className="mt-1 font-semibold">Bag 6/18</p>
          </div>
        </div>
      </div>
    </div>
  );
}
