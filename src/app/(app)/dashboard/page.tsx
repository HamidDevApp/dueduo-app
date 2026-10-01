import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarHeart, Gift, HeartHandshake, Luggage, Map as MapIcon, NotebookPen, Wallet } from "lucide-react";
import { PregnancyHero } from "@/components/dashboard/pregnancy-hero";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { Card } from "@/components/ui/card";
import { estimateLeavePlan } from "@/lib/money";
import { getPregnancyStatus } from "@/lib/pregnancy";
import {
  getOverdueTasks,
  getStageForWeek,
  isDone,
  tasksFor,
  toStateMap,
  type TaskState,
} from "@/lib/roadmap";
import { getSpace } from "@/lib/space";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Today" };

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export default async function DashboardPage() {
  const { supabase, ownerId, role, profile } = await getSpace();
  const nowIso = new Date().toISOString();

  // Always scope to the space owner: partners may also have access to their own (empty) space.
  const [nextApptRes, questionsRes, budgetRes, bagRes, registryRes, statesRes, membersRes] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("title, scheduled_at")
        .eq("user_id", ownerId)
        .eq("is_done", false)
        .gte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("doctor_questions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ownerId)
        .eq("is_asked", false),
      supabase.from("budget_items").select("estimated, actual, need_level").eq("user_id", ownerId),
      supabase.from("hospital_bag_items").select("is_packed").eq("user_id", ownerId),
      supabase.from("registry_items").select("status").eq("user_id", ownerId),
      supabase.from("roadmap_progress").select("task_key, assignee, completed_at").eq("user_id", ownerId),
      supabase.from("pregnancy_members").select("member_id").eq("owner_id", ownerId),
    ]);

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const currency = profile?.currency ?? "USD";
  const nextAppt = nextApptRes.data;
  const openQuestions = questionsRes.count ?? 0;

  // Roadmap: split this stage's tasks between "me" and my partner
  const states = toStateMap(statesRes.data as TaskState[] | null);
  const stage = status ? getStageForWeek(status.week) : null;
  const me = role === "owner" ? "mom" : "partner";
  const other = role === "owner" ? "partner" : "mom";
  const left = (who: "mom" | "partner") =>
    stage ? tasksFor(who, stage.tasks, states).filter((t) => !isDone(t, states)).length : 0;
  const stageDone = stage ? stage.tasks.filter((t) => isDone(t, states)).length : 0;
  const overdue = status ? getOverdueTasks(status.week, states).length : 0;

  // Smart budget: essentials only, plus leave gap
  const budget = budgetRes.data ?? [];
  const essentials = budget.filter((b) => b.need_level !== "skip");
  const planned = essentials.reduce((s, b) => s + Number(b.estimated), 0);
  const spent = essentials.reduce((s, b) => s + Number(b.actual), 0);
  const leavePlan =
    profile && status
      ? estimateLeavePlan(
          {
            monthlyIncome: profile.mom_monthly_income,
            leaveWeeks: profile.mom_leave_weeks,
            paidWeeks: profile.mom_paid_weeks,
            payPercent: profile.mom_leave_pay_percent,
          },
          status.daysToGo,
        )
      : null;

  const bag = bagRes.data ?? [];
  const packed = bag.filter((b) => b.is_packed).length;

  const registry = registryRes.data ?? [];
  const covered = registry.filter((r) => r.status !== "wanted").length;

  const hasPartner = (membersRes.data ?? []).length > 0;

  return (
    <div className="space-y-6">
      <PregnancyHero status={status} />

      {role === "owner" && !hasPartner && (
        <Card className="flex flex-col gap-4 bg-brand-soft/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-semibold">You don&apos;t have to remember everything.</p>
              <p className="text-sm text-muted">
                Invite {profile?.partner_name || "your partner"} as Co-Pilot — they get their own task list.
              </p>
            </div>
          </div>
          <Link
            href="/co-pilot"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
          >
            Invite now <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          href="/roadmap"
          title="This week"
          icon={MapIcon}
          value={stage ? stage.title : "Your roadmap"}
          hint={
            stage
              ? `You: ${left(me)} left · ${other === "partner" ? "Partner" : "Mom"}: ${left(other)} left${overdue ? ` · ${overdue} to catch up` : ""}`
              : "What to do, book and decide right now."
          }
          progress={stage ? pct(stageDone, stage.tasks.length) : undefined}
          cta="See this week"
        />
        <SummaryCard
          href="/appointments"
          title="Next appointment"
          icon={CalendarHeart}
          value={nextAppt ? nextAppt.title : "Nothing booked"}
          hint={nextAppt ? <LocalDateTime iso={nextAppt.scheduled_at} /> : "Add your next visit."}
          cta={nextAppt ? "View details" : "Add appointment"}
        />
        <SummaryCard
          href="/questions"
          title="Doctor questions"
          icon={NotebookPen}
          value={`${openQuestions} to ask`}
          hint="Write them down the moment you think of them."
          cta="Open list"
        />
        <SummaryCard
          href="/budget"
          title="Smart budget"
          icon={Wallet}
          value={
            leavePlan && leavePlan.incomeGap > 0
              ? `${formatMoney(leavePlan.incomeGap, currency)} leave gap`
              : `${formatMoney(spent, currency)} / ${formatMoney(planned, currency)}`
          }
          hint={
            leavePlan?.monthlySavingsTarget
              ? `Save ${formatMoney(leavePlan.monthlySavingsTarget, currency)}/month to cover it`
              : "Essentials spent vs. planned"
          }
          progress={pct(spent, planned)}
        />
        <SummaryCard
          href="/registry"
          title="Registry"
          icon={Gift}
          value={`${covered} of ${registry.length} covered`}
          hint="Purchased or received"
          progress={pct(covered, registry.length)}
        />
        <SummaryCard
          href="/hospital-bag"
          title="Hospital bag"
          icon={Luggage}
          value={`${packed} of ${bag.length} packed`}
          hint="Aim to be ready by week 36."
          progress={pct(packed, bag.length)}
        />
      </div>
    </div>
  );
}
