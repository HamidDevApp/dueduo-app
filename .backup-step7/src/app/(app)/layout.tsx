import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Topbar } from "@/components/layout/topbar";
import { getPregnancyStatus } from "@/lib/pregnancy";
import { getSpace } from "@/lib/space";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, profile } = await getSpace();

  // The owner finishes onboarding first. Partners always join an onboarded space.
  if (!profile?.due_date) {
    if (role === "owner") redirect("/onboarding");
  }

  const status = profile?.due_date ? getPregnancyStatus(profile.due_date) : null;
  const name = role === "owner" ? profile?.full_name : profile?.partner_name;

  return (
    <div className="min-h-dvh">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <Topbar name={name ?? null} status={status} />
        </div>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
