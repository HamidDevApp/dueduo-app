import type { Metadata } from "next";
import Link from "next/link";
import { Baby, Luggage, RotateCcw, Sparkles, User } from "lucide-react";
import { BagAddForm } from "@/components/bag/bag-add-form";
import { BagItemRow } from "@/components/bag/bag-item-row";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BAGS, DEFAULT_BAG, PACK_BY_WEEK, type Bag, type BagItem } from "@/lib/hospital-bag";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";
import { cn } from "@/lib/utils";
import { restoreSuggestions, unpackAll } from "./actions";

export const metadata: Metadata = { title: "Hospital bag" };

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export default async function HospitalBagPage({ searchParams }: { searchParams: Promise<{ bag?: string }> }) {
  const params = await searchParams;
  const { supabase, ownerId, role, profile } = await getSpace();

  const { data } = await supabase
    .from("hospital_bag_items")
    .select("id, bag, label, is_packed, sort_order")
    .eq("user_id", ownerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (data ?? []) as BagItem[];
  // Partners open on their own bag by default.
  const fallback: Bag = role === "partner" ? "partner" : "mom";
  const active: Bag = BAGS.includes(params.bag as Bag) ? (params.bag as Bag) : fallback;

  // Labels relative to the viewer
  const momName = role === "owner" ? "Your bag" : `${profile?.full_name || "Mom"}'s bag`;
  const partnerName = role === "partner" ? "Your bag" : `${profile?.partner_name || "Partner"}'s bag`;
  const TABS: Record<Bag, { label: string; icon: typeof Luggage }> = {
    mom: { label: momName, icon: Luggage },
    baby: { label: "Baby's bag", icon: Baby },
    partner: { label: partnerName, icon: User },
  };

  const byBag = (b: Bag) => items.filter((i) => i.bag === b);
  const packedIn = (b: Bag) => byBag(b).filter((i) => i.is_packed).length;
  const totalPacked = items.filter((i) => i.is_packed).length;

  const activeItems = byBag(active);
  const missingSuggestions = DEFAULT_BAG[active].filter(
    (label) => !activeItems.some((i) => i.label.toLowerCase() === label.toLowerCase()),
  ).length;

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const weeksUntilPack = status ? PACK_BY_WEEK - status.week : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">Hospital bag</h1>
        <p className="mt-1 text-muted">Three bags, one shared checklist — tick things off together.</p>
      </header>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {totalPacked} of {items.length} packed
          </p>
          <ProgressBar value={pct(totalPacked, items.length)} label="All bags packed" tone="sage" className="mt-2 max-w-md" />
        </div>
        <p className="text-sm text-muted sm:text-right">
          {weeksUntilPack === null
            ? `Aim to be ready by week ${PACK_BY_WEEK}.`
            : weeksUntilPack > 0
              ? `Ready by week ${PACK_BY_WEEK} — that's ${weeksUntilPack} week${weeksUntilPack === 1 ? "" : "s"} from now.`
              : "Keep the bags by the door and the car ready. 🚗"}
        </p>
      </Card>

      {/* Tabs */}
      <nav aria-label="Bags" className="grid grid-cols-3 gap-2 rounded-xl bg-surface p-1">
        {BAGS.map((b) => {
          const Icon = TABS[b].icon;
          const total = byBag(b).length;
          return (
            <Link
              key={b}
              href={`/hospital-bag?bag=${b}`}
              aria-current={active === b ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-sm font-semibold sm:flex-row sm:justify-center sm:gap-2",
                active === b ? "bg-brand-soft text-brand-strong" : "text-muted hover:text-ink",
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span className="truncate">{TABS[b].label}</span>
              <span className="text-xs font-normal">
                {packedIn(b)}/{total}
              </span>
            </Link>
          );
        })}
      </nav>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">{TABS[active].label}</h2>
          {packedIn(active) > 0 && (
            <form action={unpackAll.bind(null, active)}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-canvas hover:text-ink">
                <RotateCcw className="size-3.5" aria-hidden /> Re-check all
              </button>
            </form>
          )}
        </div>

        {activeItems.length > 0 ? (
          <ul className="mt-2 divide-y divide-line">
            {activeItems.map((i) => (
              <BagItemRow key={i.id} item={i} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted">This bag is empty.</p>
        )}

        <div className="mt-3 space-y-3 border-t border-line pt-4">
          <BagAddForm key={active} bag={active} />
          {missingSuggestions > 0 && (
            <form action={restoreSuggestions.bind(null, active)}>
              <button type="submit" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong">
                <Sparkles className="size-4" aria-hidden /> Add {missingSuggestions} suggested item{missingSuggestions === 1 ? "" : "s"}
              </button>
            </form>
          )}
        </div>
      </Card>

      {active === "baby" && (
        <p className="rounded-xl bg-sage-soft p-4 text-sm">
          💡 Many hospitals expect a properly installed car seat before you drive home. Get the installation checked by a certified technician if you can.
        </p>
      )}
    </div>
  );
}
