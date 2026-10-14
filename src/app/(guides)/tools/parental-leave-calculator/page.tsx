import type { Metadata } from "next";
import { GuideCta, GuideHeader, Prose } from "@/components/guides/guide-parts";
import { LeaveCalculator } from "@/components/guides/leave-calculator";
import { GUIDES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.leaveCalculator;
export const metadata: Metadata = guideMetadata(guide);

export default function ParentalLeaveCalculatorPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <GuideHeader guide={guide} />
      <Prose className="mt-6">
        <p>
          Leave is often partly paid, or not paid at all. Enter your own numbers to see how much income you&apos;ll lose
          during leave, and how much to put aside each month until the baby arrives. Nothing you type is saved or sent
          anywhere.
        </p>
      </Prose>

      <div className="mt-10">
        <LeaveCalculator />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">How we calculate</h2>
        <Prose className="mt-3">
          <p>
            We turn monthly pay into weekly pay (monthly pay × 12 ÷ 52). Paid weeks lose the share of pay you don&apos;t
            get, and unpaid weeks lose all of it. The monthly target divides the total gap by the full months left until
            the due date.
          </p>
        </Prose>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Example figures</h2>
        <Prose className="mt-3">
          <p>
            The birthing parent takes home $4,000 a month and takes 16 weeks off, 6 of them at full pay. The partner takes
            home $3,500 and takes 4 weeks off, 2 of them at full pay. The income gap is $9,231 + $1,615 = $10,846. With 6
            full months until the due date, that&apos;s $1,808 a month.
          </p>
        </Prose>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-muted">
        This is an estimate for planning, not financial advice. Leave rules differ by country, state and employer, so
        check what you&apos;re entitled to with your employer or government.
      </p>

      <GuideCta guide={guide}>
        In DueDuo, the leave gap sits next to the rest of the baby budget: what you&apos;ll buy, what you can skip or
        borrow, and when to buy it, with the monthly target updating as your due date gets closer.
      </GuideCta>
    </article>
  );
}
