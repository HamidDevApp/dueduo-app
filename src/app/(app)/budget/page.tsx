import type { Metadata } from "next";
import { PiggyBank, Sparkles } from "lucide-react";
import { AddBudgetItem } from "@/components/budget/add-budget-item";
import { BudgetItemRow } from "@/components/budget/budget-item-row";
import { LeavePlanForm } from "@/components/budget/leave-plan-form";
import { SkipGuide } from "@/components/budget/skip-guide";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NEED_LABELS, STARTER_KIT, type BudgetItem, type NeedLevel } from "@/lib/budget";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";
import { formatMoney } from "@/lib/utils";
import { importStarterKit } from "./actions";

export const metadata: Metadata = { title: "Smart budget" };

const str = (v: number | null | undefined) => (v == null ? "" : String(v));

export default async function BudgetPage() {
  const { supabase, ownerId, role, profile } = await getSpace();
  const currency = profile?.currency ?? "USD";
  const money = (v: number) => formatMoney(v, currency);

  const { data } = await supabase
    .from("budget_items")
    .select("id, label, category, need_level, source, estimated, actual, is_paid, buy_by_week")
    .eq("user_id", ownerId)
    .order("buy_by_week", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  // numeric columns arrive as strings from PostgREST — normalise once here
  const items: BudgetItem[] = (data ?? []).map((r) => ({
    ...(r as BudgetItem),
    estimated: Number(r.estimated),
    actual: Number(r.actual),
  }));

  const byNeed = (n: NeedLevel) => items.filter((i) => i.need_level === n);
  const essentials = byNeed("essential");
  const nice = byNeed("nice");
  const skipped = byNeed("skip");

  const cost = (i: BudgetItem) => i.actual || i.estimated;
  const essentialsPlanned = essentials.reduce((s, i) => s + cost(i), 0);
  const essentialsRemaining = essentials.filter((i) => !i.is_paid).reduce((s, i) => s + i.estimated, 0);
  const essentialsBought = essentials.filter((i) => i.is_paid).length;
  const niceTotal = nice.reduce((s, i) => s + cost(i), 0);
  const kept = skipped.reduce((s, i) => s + i.estimated, 0);
  const secondHandCount = items.filter((i) => i.source !== "buy_new" && i.need_level !== "skip").length;

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;

  const sections: { need: NeedLevel; rows: BudgetItem[]; add: string }[] = [
    { need: "essential", rows: essentials, add: "Add essential" },
    { need: "nice", rows: nice, add: "Add nice-to-have" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">Smart budget</h1>
        <p className="mt-1 text-muted">
          Plan the leave, buy only what matters, and see exactly what to set aside each month.
        </p>
      </header>

      {/* ---------- Leave plan ---------- */}
      <section id="leave-plan" aria-labelledby="leave-title" className="scroll-mt-24">
        <Card>
          <div className="mb-5 flex items-center gap-2.5">
            <PiggyBank className="size-5 text-brand" aria-hidden />
            <h2 id="leave-title" className="font-display text-2xl">
              Maternity leave plan
            </h2>
          </div>
          <LeavePlanForm
            readOnly={role !== "owner"}
            daysToGo={status?.daysToGo ?? 0}
            essentialsRemaining={essentialsRemaining}
            defaults={{
              currency,
              momIncome: str(profile?.mom_monthly_income),
              partnerIncome: str(profile?.partner_monthly_income),
              leaveWeeks: str(profile?.mom_leave_weeks),
              paidWeeks: str(profile?.mom_paid_weeks),
              payPercent: str(profile?.mom_leave_pay_percent),
              partnerLeaveWeeks: str(profile?.partner_leave_weeks),
            }}
          />
        </Card>
      </section>

      {/* ---------- Summary ---------- */}
      <section aria-label="Budget summary" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Essentials</p>
          <p className="mt-1 font-display text-2xl">{money(essentialsPlanned)}</p>
          <ProgressBar
            value={essentials.length ? (essentialsBought / essentials.length) * 100 : 0}
            label="Essentials bought"
            tone="sage"
            className="mt-3"
          />
          <p className="mt-1.5 text-xs text-muted">
            {essentialsBought} of {essentials.length} bought
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Nice to have</p>
          <p className="mt-1 font-display text-2xl">{money(niceTotal)}</p>
          <p className="mt-3 text-xs text-muted">Wait until after gifts arrive — many of these turn up for free.</p>
        </Card>
        <Card className="bg-sage-soft/70">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Money kept</p>
          <p className="mt-1 font-display text-2xl text-sage">{money(kept)}</p>
          <p className="mt-3 text-xs text-muted">
            From {skipped.length} skipped item{skipped.length === 1 ? "" : "s"}
            {secondHandCount > 0 && ` · ${secondHandCount} second-hand, borrowed or gifted`}
          </p>
        </Card>
      </section>

      {/* ---------- Starter kit ---------- */}
      {items.length === 0 && (
        <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">Start with our lean list</p>
              <p className="text-sm text-muted">
                {STARTER_KIT.length} items that actually matter in the first 3 months. Just add your prices.
              </p>
            </div>
          </div>
          <form action={importStarterKit}>
            <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Add the starter list
            </button>
          </form>
        </Card>
      )}

      {/* ---------- Essential / Nice ---------- */}
      {sections.map(({ need, rows, add }) => (
        <section key={need} aria-labelledby={`${need}-title`}>
          <Card>
            <div className="flex items-baseline justify-between gap-4">
              <h2 id={`${need}-title`} className="font-display text-2xl">
                {NEED_LABELS[need].title}
              </h2>
              <p className="text-sm text-muted">{NEED_LABELS[need].hint}</p>
            </div>
            {rows.length > 0 ? (
              <ul className="mt-2 divide-y divide-line">
                {rows.map((i) => (
                  <BudgetItemRow key={i.id} item={i} currency={currency} />
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-muted">Nothing here yet.</p>
            )}
            <div className="mt-2 border-t border-line pt-3">
              <AddBudgetItem need={need} currency={currency} label={add} />
            </div>
          </Card>
        </section>
      ))}

      {/* ---------- Skip list ---------- */}
      <section id="skip-list" aria-labelledby="skip-title" className="scroll-mt-24">
        <Card>
          <h2 id="skip-title" className="font-display text-2xl">
            The Skip list
          </h2>
          <p className="mt-1 text-sm text-muted">
            Things most families buy and barely use — plus a few that aren&apos;t safe for sleep.
          </p>
          <div className="mt-5">
            <SkipGuide />
          </div>

          <h3 className="mt-8 font-semibold">Your skipped items</h3>
          <p className="text-sm text-muted">Add anything you decided not to buy, with its price — watch the money you keep grow.</p>
          {skipped.length > 0 && (
            <ul className="mt-2 divide-y divide-line">
              {skipped.map((i) => (
                <BudgetItemRow key={i.id} item={i} currency={currency} />
              ))}
            </ul>
          )}
          <div className="mt-2 border-t border-line pt-3">
            <AddBudgetItem need="skip" currency={currency} label="Add skipped item" />
          </div>
        </Card>
      </section>
    </div>
  );
}
