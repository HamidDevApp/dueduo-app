import type { Metadata } from "next";
import { CheckCircle2, HeartHandshake, MessageCircle, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { getPregnancyStatus } from "@/lib/pregnancy";
import {
  OWNER_LABELS,
  getStageForWeek,
  isDone,
  partnerShare,
  resolveOwner,
  toStateMap,
  type TaskState,
} from "@/lib/roadmap";
import { SCRIPTS, dueMonthLabel, renderScript, whatsappUrl } from "@/lib/scripts";
import { siteOrigin } from "@/lib/site";
import { getSpace } from "@/lib/space";
import { createPartnerInvite } from "./actions";

export const metadata: Metadata = { title: "Co-Pilot" };

export default async function CoPilotPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const { supabase, ownerId, role, profile } = await getSpace();

  const [membersRes, inviteRes, statesRes] = await Promise.all([
    supabase.from("pregnancy_members").select("member_id").eq("owner_id", ownerId),
    role === "owner"
      ? supabase
          .from("partner_invites")
          .select("token")
          .is("accepted_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("roadmap_progress").select("task_key, assignee, completed_at").eq("user_id", ownerId),
  ]);

  const hasPartner = (membersRes.data ?? []).length > 0;
  const states = toStateMap(statesRes.data as TaskState[] | null);
  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const stage = status ? getStageForWeek(status.week) : null;
  const partnerTasks = stage ? stage.tasks.filter((t) => resolveOwner(t, states) === "partner") : [];

  const token = inviteRes.data?.token as string | undefined;
  const inviteLink = token ? `${await siteOrigin()}/invite/${token}` : null;
  const message = inviteLink
    ? renderScript(SCRIPTS["partner-invite"].body, {
        partnerName: profile?.partner_name,
        dueMonth: dueMonthLabel(profile?.due_date),
        inviteLink,
      })
    : null;

  const partnerName = profile?.partner_name || "your partner";

  return (
    <div className="space-y-6">
      {welcome && (
        <Card className="flex items-start gap-3 bg-sage-soft">
          <PartyPopper className="mt-0.5 size-5 shrink-0 text-sage" aria-hidden />
          <div>
            <p className="font-semibold">Your plan is ready.</p>
            <p className="text-sm text-muted">One last step: bring {partnerName} on board.</p>
          </div>
        </Card>
      )}

      <div>
        <h1 className="font-display text-3xl">Co-Pilot mode</h1>
        <p className="mt-1 text-muted">
          {role === "partner"
            ? `You're the Co-Pilot for ${profile?.full_name || "your partner"}'s pregnancy. These tasks are yours.`
            : `About ${partnerShare(states)}% of the roadmap is handled by ${partnerName} — so you're not carrying it alone.`}
        </p>
      </div>

      {role === "owner" && (
        <Card>
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="size-5 text-brand" aria-hidden />
            <h2 className="font-semibold">{hasPartner ? "Co-Pilot is active" : `Invite ${partnerName}`}</h2>
          </div>

          {hasPartner ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 className="size-4 text-sage" aria-hidden />
              {partnerName} has joined and sees their tasks, appointments and scripts.
            </p>
          ) : inviteLink && message ? (
            <>
              <p className="mt-2 text-sm text-muted">
                They&apos;ll create a free login and land straight on their task list. The link works for 14 days.
              </p>
              <blockquote className="mt-4 rounded-xl bg-canvas p-4 text-sm leading-relaxed">{message}</blockquote>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={whatsappUrl(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
                >
                  <MessageCircle className="size-4" aria-hidden /> Send on WhatsApp
                </a>
                <CopyButton value={inviteLink} />
              </div>
            </>
          ) : (
            <form action={createPartnerInvite} className="mt-4">
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-strong"
              >
                Create invite link
              </button>
            </form>
          )}
        </Card>
      )}

      {stage && (
        <Card>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {OWNER_LABELS.partner} · {stage.title}
          </p>
          <p className="mt-1 font-display text-xl">{stage.partnerFocus}</p>
          <ul className="mt-4 divide-y divide-line">
            {partnerTasks.map((t) => (
              <li key={t.key} className="flex items-start gap-3 py-3">
                <CheckCircle2
                  className={isDone(t, states) ? "mt-0.5 size-5 text-sage" : "mt-0.5 size-5 text-line"}
                  aria-label={isDone(t, states) ? "Done" : "Not done"}
                />
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-muted">
                    {t.detail} <span className="whitespace-nowrap">· ~{t.minutes} min</span>
                  </p>
                </div>
              </li>
            ))}
            {partnerTasks.length === 0 && (
              <li className="py-3 text-sm text-muted">No partner-only tasks this week — check the shared ones on the roadmap.</li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}
