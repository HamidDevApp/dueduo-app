import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/sections";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="bg-canvas">{children}</main>
      <SiteFooter />
    </>
  );
}
