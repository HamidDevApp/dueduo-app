import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, HeartHandshake, LogOut, Pencil } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { ConfirmAction } from "@/components/settings/confirm-action";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { Card } from "@/components/ui/card";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";
import { formatLongDate } from "@/lib/utils";
import { leavePlan, removeCoPilot, revokeInvites } from "./actions";

export const metadata: Metadata = { title: "Settings" };

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium sm:text-right">{value}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const { supabase, user, ownerId, role, profile } = await getSpace();
  const isOwner = role === "owner";

  // Queried here (not via getSpace) so this page works before and after the payments step.
  const [accessRes, membersRes, invitesRes] = await Promise.all([
    supabase.from("profiles").select("has_access").eq("id", ownerId).maybeSingle(),
    supabase.from("pregnancy_members").select("member_id, created_at").eq("owner_id", ownerId),
    isOwner
      ? supabase
          .from("partner_invites")
          .select("id", { count: "exact", head: true })
          .is("accepted_at", null)
          .gt("expires_at", new Date().toISOString())
      : Promise.resolve({ count: 0 }),
  ]);

  const hasAccess = Boolean(accessRes.data?.has_access);
  const member = membersRes.data?.[0] as { member_id: string; created_at: string } | undefined;
  const pendingInvites = invitesRes.count ?? 0;

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const partnerName = profile?.partner_name || "your partner";
  const ownerName = profile?.full_name || "the plan owner";

  const deletionMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete my account")}&body=${encodeURIComponent(
    `Please delete my First Pregnancy Planner account and all its data.\n\nAccount email: ${user.email ?? ""}`,
  )}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl">Settings</h1>
        <p className="mt-1 text-muted">Your account, your plan and who you share it with.</p>
      </header>

      {/* ---------- Account ---------- */}
      <Card>
        <h2 className="font-display text-2xl">Account</h2>
        <dl className="mt-2 divide-y divide-line">
          <Row label="Email" value={user.email ?? "—"} />
          <Row label="Role" value={isOwner ? "Plan owner" : `Co-Pilot on ${ownerName}'s plan`} />
          <Row
            label="Access"
            value={
              hasAccess ? (
                <span className="inline-flex items-center gap-1.5 text-sage">
                  <CheckCircle2 className="size-4" aria-hidden /> Unlocked
                </span>
              ) : (
                "Not unlocked yet"
              )
            }
          />
        </dl>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-canvas"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </Card>

      {/* ---------- Pregnancy plan ---------- */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">Pregnancy plan</h2>
          {isOwner && (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              <Pencil className="size-4" aria-hidden /> Edit
            </Link>
          )}
        </div>
        <dl className="mt-2 divide-y divide-line">
          <Row label="Due date" value={profile?.due_date ? formatLongDate(profile.due_date) : "—"} />
          <Row label="Right now" value={status ? `Week ${status.week} + ${status.day}d · Trimester ${status.trimester}` : "—"} />
          <Row label="Mom" value={profile?.full_name || "—"} />
          <Row label="Partner / support person" value={profile?.partner_name || "—"} />
          <Row label="Hospital or birth center" value={profile?.hospital_name || "—"} />
        </dl>
        {isOwner && (
          <p className="mt-3 text-xs text-muted">
            Your dating scan changed the due date? Update it via Edit — the roadmap, countdown and printouts adjust
            automatically.
          </p>
        )}
      </Card>

      {/* ---------- Preferences ---------- */}
      <Card>
        <h2 className="font-display text-2xl">Preferences</h2>
        <p className="mt-1 mb-4 text-sm text-muted">Used for your budget and to suggest the right boundary scripts.</p>
        <PreferencesForm
          readOnly={!isOwner}
          defaults={{
            currency: profile?.currency ?? "USD",
            workStatus: profile?.work_status ?? "not_yet",
            visitorPolicy: profile?.visitor_policy ?? "limited",
          }}
        />
        {isOwner && (
          <p className="mt-4 text-xs text-muted">
            Income and leave details live in{" "}
            <Link href="/budget#leave-plan" className="font-semibold text-brand hover:text-brand-strong">
              Smart budget → Leave plan
            </Link>
            .
          </p>
        )}
      </Card>

      {/* ---------- Co-Pilot ---------- */}
      <Card>
        <div className="flex items-center gap-2.5">
          <HeartHandshake className="size-5 text-brand" aria-hidden />
          <h2 className="font-display text-2xl">Co-Pilot</h2>
        </div>

        {isOwner ? (
          member ? (
            <div className="mt-3 space-y-4">
              <p className="text-sm">
                <span className="font-semibold">{partnerName}</span> joined on{" "}
                {formatLongDate(member.created_at.slice(0, 10))} and shares your whole plan.
              </p>
              <ConfirmAction
                action={removeCoPilot}
                label="Remove Co-Pilot"
                confirmText={`${partnerName} will immediately lose access to your plan. Everything they added stays with you. You can invite them again anytime.`}
                confirmLabel="Remove access"
              />
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <p className="text-sm text-muted">
                No Co-Pilot yet.{" "}
                {pendingInvites > 0
                  ? `You have ${pendingInvites} active invite link${pendingInvites === 1 ? "" : "s"}.`
                  : "Invite your partner so they get their own task list."}
              </p>
              <div className="flex flex-wrap items-start gap-2">
                <Link
                  href="/co-pilot"
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
                >
                  {pendingInvites > 0 ? "Open invite" : "Invite partner"}
                </Link>
                {pendingInvites > 0 && (
                  <ConfirmAction
                    action={revokeInvites}
                    tone="neutral"
                    label="Cancel invite links"
                    confirmText="Any invite link you've already sent will stop working. You can create a new one on the Co-Pilot page."
                    confirmLabel="Cancel links"
                  />
                )}
              </div>
            </div>
          )
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm">
              You&apos;re the Co-Pilot on <span className="font-semibold">{ownerName}</span>&apos;s plan.
            </p>
            <ConfirmAction
              action={leavePlan}
              label="Leave this plan"
              confirmText={`You'll lose access to ${ownerName}'s plan straight away. Only they can invite you back.`}
              confirmLabel="Leave plan"
            />
          </div>
        )}
      </Card>

      {/* ---------- Help & data ---------- */}
      <Card>
        <h2 className="font-display text-2xl">Help & your data</h2>
        <div className="mt-3 space-y-3 text-sm">
          <p>
            Questions or problems?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-brand hover:text-brand-strong">
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-muted">
            Want your account and all planner data permanently deleted?{" "}
            <a href={deletionMailto} className="font-semibold text-brand-strong underline-offset-2 hover:underline">
              Request account deletion
            </a>
            . We&apos;ll confirm by email.
          </p>
          <p className="text-xs text-muted">
            This planner is for organization only and isn&apos;t medical advice. Always follow your doctor or midwife.
          </p>
        </div>
      </Card>
    </div>
  );
}
