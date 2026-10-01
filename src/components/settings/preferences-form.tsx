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
