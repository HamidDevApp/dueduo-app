import type { Metadata } from "next";
import { Gift, Sparkles } from "lucide-react";
import { AddRegistryItem } from "@/components/registry/add-registry-item";
import { RegistryRow } from "@/components/registry/registry-row";
import { ScriptSheet } from "@/components/roadmap/script-sheet";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PRIORITY_LABELS, REGISTRY_PRIORITIES, type RegistryItem } from "@/lib/registry";
import { getSpace } from "@/lib/space";
import { formatMoney } from "@/lib/utils";
import { importRegistryStarter } from "./actions";

export const metadata: Metadata = { title: "Registry" };

export default async function RegistryPage() {
  const { supabase, ownerId, profile } = await getSpace();
  const currency = profile?.currency ?? "USD";

  const { data } = await supabase
    .from("registry_items")
    .select("id, name, category, priority, url, price, status")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: true });

  const items: RegistryItem[] = (data ?? []).map((r) => ({
    ...(r as RegistryItem),
    price: r.price == null ? null : Number(r.price), // numeric arrives as string
  }));

  const must = items.filter((i) => i.priority === "must");
  const mustCovered = must.filter((i) => i.status !== "wanted").length;
  const stillNeeded = items.filter((i) => i.status === "wanted");
  const neededValue = stillNeeded.reduce((s, i) => s + (i.price ?? 0), 0);

  // A plain-text list people can read in WhatsApp — no public page needed.
  const shareText = [
    "Hi! 💛 Here's what we still need for baby:",
    "",
    ...REGISTRY_PRIORITIES.filter((p) => p !== "later").flatMap((p) => {
      const rows = stillNeeded.filter((i) => i.priority === p);
      if (!rows.length) return [];
      return [`${PRIORITY_LABELS[p].title}:`, ...rows.map((i) => `• ${i.name}${i.url ? ` — ${i.url}` : ""}`), ""];
    }),
    "Honestly, a home-cooked meal after the birth is the best gift of all. Thank you! 🤍",
  ].join("\n");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Registry</h1>
          <p className="mt-1 text-muted">One shared list, so nobody buys the same thing twice.</p>
        </div>
        {stillNeeded.length > 0 && (
          <ScriptSheet
            label="Share on WhatsApp"
            title="Share what you still need"
            text={shareText}
            tip="Send it to the person organizing gifts, and mark items as Bought when someone tells you."
          />
        )}
      </header>

      <section aria-label="Registry summary" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Must-haves covered</p>
          <p className="mt-1 font-display text-2xl">
            {mustCovered} of {must.length}
          </p>
          <ProgressBar value={must.length ? (mustCovered / must.length) * 100 : 0} label="Must-haves covered" tone="sage" className="mt-3" />
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Still needed</p>
          <p className="mt-1 font-display text-2xl">{stillNeeded.length} items</p>
          <p className="mt-3 text-xs text-muted">{neededValue ? `About ${formatMoney(neededValue, currency)}` : "Add prices to see the total"}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Received</p>
          <p className="mt-1 font-display text-2xl">{items.filter((i) => i.status === "received").length}</p>
          <p className="mt-3 text-xs text-muted">Remember the thank-you notes 💌</p>
        </Card>
      </section>

      {items.length === 0 && (
        <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">Start from the lean essentials</p>
              <p className="text-sm text-muted">The same must-haves as your Smart Budget — no fluff.</p>
            </div>
          </div>
          <form action={importRegistryStarter}>
            <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong">
              Add essentials
            </button>
          </form>
        </Card>
      )}

      {REGISTRY_PRIORITIES.map((p) => {
        const rows = items.filter((i) => i.priority === p);
        return (
          <section key={p} aria-labelledby={`reg-${p}`}>
            <Card>
              <div className="flex items-baseline justify-between gap-4">
                <h2 id={`reg-${p}`} className="flex items-center gap-2 font-display text-2xl">
                  {p === "must" && <Gift className="size-5 text-brand" aria-hidden />}
                  {PRIORITY_LABELS[p].title}
                </h2>
                <p className="text-sm text-muted">{PRIORITY_LABELS[p].hint}</p>
              </div>
              {rows.length > 0 ? (
                <ul className="mt-2 divide-y divide-line">
                  {rows.map((i) => (
                    <RegistryRow key={i.id} item={i} currency={currency} />
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-sm text-muted">Nothing here yet.</p>
              )}
              <div className="mt-2 border-t border-line pt-3">
                <AddRegistryItem priority={p} currency={currency} />
              </div>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
