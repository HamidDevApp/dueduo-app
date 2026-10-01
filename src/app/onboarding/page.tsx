import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Baby } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { PREGNANCY_DAYS, addDays, isoToday } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export const metadata: Metadata = { title: "Set up your plan" };

export default async function OnboardingPage() {
  const { role, profile } = await getSpace();
  if (role === "partner") redirect("/dashboard"); // only the owner sets up the space
  if (!profile?.has_access) redirect("/checkout");

  const today = isoToday();
  const limits = {
    due: { min: addDays(today, -14), max: addDays(today, PREGNANCY_DAYS) },
    lmp: { min: addDays(today, -(PREGNANCY_DAYS + 14)), max: today },
  };

  const isEditing = Boolean(profile?.due_date);

  return (
    <main className="min-h-dvh px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Baby className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">
            {isEditing ? "Update your plan" : "Let’s build your plan"}
          </h1>
          <p className="mt-2 text-muted">
            Two minutes now, and we&apos;ll handle the what, when and who for the next nine months.
          </p>
        </div>

        <OnboardingWizard
          limits={limits}
          defaults={{
            dueDate: profile?.due_date ?? "",
            fullName: profile?.full_name ?? "",
            partnerName: profile?.partner_name ?? "",
            hospitalName: profile?.hospital_name ?? "",
            currency: profile?.currency ?? "USD",
            momIncome: profile?.mom_monthly_income?.toString() ?? "",
            partnerIncome: profile?.partner_monthly_income?.toString() ?? "",
            leaveWeeks: profile?.mom_leave_weeks?.toString() ?? "",
            paidWeeks: profile?.mom_paid_weeks?.toString() ?? "",
            payPercent: profile?.mom_leave_pay_percent?.toString() ?? "",
            partnerLeaveWeeks: profile?.partner_leave_weeks?.toString() ?? "",
            workStatus: profile?.work_status ?? "not_yet",
            visitorPolicy: profile?.visitor_policy ?? "limited",
          }}
        />

        {isEditing && (
          <p className="mt-6 text-center text-sm">
            <Link href="/dashboard" className="font-semibold text-brand hover:text-brand-strong">
              ← Back to dashboard
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
