import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/sections";

/** Public guides: free, useful pages that bring visitors from search and Pinterest. */
export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main className="bg-canvas print:bg-white">{children}</main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </>
  );
}
