# Settings page (fixes the /settings 404)

4 new files. No database changes; works before and after the Stripe step (0003).

## `src/app/(app)/settings/page.tsx`

```tsx
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
```

## `src/app/(app)/settings/actions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readEnum } from "@/lib/form";
import { CURRENCIES } from "@/lib/money";
import { getSpace } from "@/lib/space";

export type SettingsFormState = { ok: boolean; error: string | null; savedAt?: number };

const WORK_STATUS = ["not_yet", "told", "not_applicable"] as const;
const VISITOR_POLICY = ["welcome", "limited", "none_first_weeks"] as const;

/** Owner only: preferences that personalise scripts and money screens. */
export async function savePreferences(_prev: SettingsFormState, fd: FormData): Promise<SettingsFormState> {
  const currency = readEnum(fd, "currency", CURRENCIES);
  const workStatus = readEnum(fd, "work_status", WORK_STATUS);
  const visitorPolicy = readEnum(fd, "visitor_policy", VISITOR_POLICY);
  if (!currency || !workStatus || !visitorPolicy) return { ok: false, error: "Please check your choices." };

  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return { ok: false, error: "Only the plan owner can change these settings." };

  const { data, error } = await supabase
    .from("profiles")
    .update({ currency, work_status: workStatus, visitor_policy: visitorPolicy })
    .eq("id", user.id)
    .select("id");

  // Supabase doesn't error on 0-row updates — check explicitly.
  if (error || !data?.length) {
    console.error("[settings] preferences update failed", { userId: user.id, error, rows: data?.length ?? 0 });
    return { ok: false, error: "Couldn't save. Please try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, error: null, savedAt: Date.now() };
}

/** Owner: remove the Co-Pilot. Their access ends immediately; shared data stays with you. */
export async function removeCoPilot(): Promise<void> {
  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return;
  await supabase.from("pregnancy_members").delete().eq("owner_id", user.id);
  revalidatePath("/", "layout");
}

/** Owner: invalidate any invite links that haven't been used yet. */
export async function revokeInvites(): Promise<void> {
  const { supabase, user, role } = await getSpace();
  if (role !== "owner") return;
  await supabase.from("partner_invites").delete().eq("owner_id", user.id).is("accepted_at", null);
  revalidatePath("/settings");
  revalidatePath("/co-pilot");
}

/** Partner: leave the shared plan. */
export async function leavePlan(): Promise<void> {
  const { supabase, user, role } = await getSpace();
  if (role !== "partner") return;
  await supabase.from("pregnancy_members").delete().eq("member_id", user.id);
  revalidatePath("/", "layout");
  redirect("/");
}
```

## `src/components/settings/preferences-form.tsx`

```tsx
"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { savePreferences, type SettingsFormState } from "@/app/(app)/settings/actions";
import { CURRENCIES } from "@/lib/money";

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-brand disabled:bg-canvas disabled:text-muted";

type Props = {
  defaults: { currency: string; workStatus: string; visitorPolicy: string };
  readOnly: boolean;
};

export function PreferencesForm({ defaults, readOnly }: Props) {
  const [state, action, pending] = useActionState<SettingsFormState, FormData>(savePreferences, { ok: false, error: null });

  return (
    // defaultValue + key on savedAt: after a save, the form re-mounts with the stored values.
    <form action={action} key={state.savedAt ?? 0} className="space-y-4">
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium">Currency</span>
          <select name="currency" defaultValue={defaults.currency} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Told work yet?</span>
          <select name="work_status" defaultValue={defaults.workStatus} className={inputClass}>
            <option value="not_yet">Not yet</option>
            <option value="told">Yes, they know</option>
            <option value="not_applicable">Doesn&apos;t apply</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Visitors after birth</span>
          <select name="visitor_policy" defaultValue={defaults.visitorPolicy} className={inputClass}>
            <option value="welcome">Visitors welcome</option>
            <option value="limited">Limited visits</option>
            <option value="none_first_weeks">Just us at first</option>
          </select>
        </label>
      </fieldset>

      {readOnly ? (
        <p className="text-sm text-muted">Only the plan owner can change these.</p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save preferences"}
          </button>
          {state.ok && (
            <span className="inline-flex items-center gap-1 text-sm text-sage">
              <Check className="size-4" aria-hidden /> Saved
            </span>
          )}
          {state.error && (
            <span role="alert" className="text-sm text-brand-strong">
              {state.error}
            </span>
          )}
        </div>
      )}
    </form>
  );
}
```

## `src/components/settings/confirm-action.tsx`

```tsx
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-strong px-3 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
    >
      {pending ? "Working…" : label}
    </button>
  );
}

type Props = {
  /** A server action taking no arguments. */
  action: () => Promise<void>;
  label: string;
  confirmText: string;
  confirmLabel?: string;
  tone?: "danger" | "neutral";
};

/** Two-step button: click, read the consequence, confirm. No browser dialogs. */
export function ConfirmAction({ action, label, confirmText, confirmLabel = "Yes, continue", tone = "danger" }: Props) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm font-semibold",
          tone === "danger"
            ? "border-brand/40 text-brand-strong hover:bg-brand-soft"
            : "border-line text-ink hover:bg-canvas",
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-soft/50 p-3">
      <p className="text-sm">{confirmText}</p>
      <form action={action} className="mt-3 flex gap-2">
        <SubmitButton label={confirmLabel} />
        <button type="button" onClick={() => setAsking(false)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas">
          Cancel
        </button>
      </form>
    </div>
  );
}
```

