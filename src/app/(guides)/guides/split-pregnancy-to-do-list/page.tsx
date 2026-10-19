import type { Metadata } from "next";
import Link from "next/link";
import { GuideCta, GuideHeader, Prose, SourceLink, Sources } from "@/components/guides/guide-parts";
import { GuidePrintButton } from "@/components/guides/print-button";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.splitList;
export const metadata: Metadata = guideMetadata(guide);

const h2 = "mt-14 font-display text-2xl font-semibold tracking-tight";

const JOBS = [
  {
    job: "Prenatal appointments and the shared calendar",
    week: "Ongoing",
    owner: "Birthing parent books, partner keeps the calendar",
  },
  { job: "Baby budget and both leave policies", week: "Weeks 9 to 10", owner: "Together, then one owner" },
  { job: "Childcare research and waitlists", week: "Weeks 14 to 16", owner: "Partner" },
  { job: "Parental leave paperwork", week: "Weeks 20 to 22", owner: "Each parent for their own" },
  {
    job: "Choosing a pediatrician",
    week: "Weeks 23 to 25",
    owner: "Partner, with a visit together in the third trimester",
  },
  { job: "After-birth plan: nights, chores, visitors", week: "Weeks 26 to 27", owner: "Together" },
  { job: "Meal train", week: "Weeks 31 to 33", owner: "Partner" },
  { job: "Hospital bags", week: "Weeks 34 to 35", owner: "Each packs their own, partner packs the baby's" },
  { job: "Car seat installed and checked", week: "By week 36", owner: "Partner" },
  { job: "Telling family and work", week: "When you're ready", owner: "Each tells their own family and employer" },
] as const;

const OWNER_OPTIONS = ["Me", "Partner", "Together"] as const;
const BLANK_ROWS = Array.from({ length: 5 }, (_, i) => i);

function OwnerTicks() {
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted print:gap-x-1.5 print:text-[8pt] print:text-black">
      {OWNER_OPTIONS.map((option) => (
        <span key={option} className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="inline-block size-2.5 border border-ink/50 print:size-2 print:border-black" aria-hidden />
          {option}
        </span>
      ))}
    </span>
  );
}

export default function SplitPregnancyToDoListPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16 print:max-w-none print:p-0">
      <style>{`@page { size: auto; margin: 12mm 14mm; }`}</style>

      <div className="print:hidden">
        <GuideHeader guide={guide} />
        <Prose className="mt-6">
          <p>
            A pregnancy to-do list isn&apos;t only booking and buying. Someone has to notice that the daycare waitlist is
            filling up, find three options, pick one and check the deposit went through. That invisible part is what
            wears one person out, and it rarely shows up on a shared list.
          </p>
          <p>
            Sociologist Allison Daminger calls it <SourceLink source={SOURCES.daminger}>cognitive labor</SourceLink>:
            anticipating needs, identifying options, making decisions and monitoring progress. In her interviews with 35
            couples, women did more of the anticipating and monitoring in particular.
          </p>
          <p>
            This guide shows a 20-minute way to split the list so you each own whole jobs, start to finish, plus a
            printable sheet to fill in together.
          </p>
        </Prose>

        <h2 className={h2}>Own whole jobs, not chores</h2>
        <Prose className="mt-4">
          <p>
            &ldquo;Just tell me what to do&rdquo; sounds helpful, but it leaves the noticing, the research and the
            checking with one person. A fair split hands over the whole job:
          </p>
          <ol className="list-decimal space-y-2.5 pl-5">
            <li>
              <strong>Notice:</strong> keep track of when it needs to happen.
            </li>
            <li>
              <strong>Research:</strong> find the options and what they cost.
            </li>
            <li>
              <strong>Decide:</strong> choose, or bring two good options to the other person when it&apos;s a joint call.
            </li>
            <li>
              <strong>Finish:</strong> book it, pay for it and check it&apos;s done.
            </li>
          </ol>
          <p>
            When you own a job, nobody has to remind you about it. That&apos;s the part that actually lightens the load.
          </p>
        </Prose>

        <h2 className={h2}>The 20-minute split</h2>
        <Prose className="mt-4">
          <p>
            Sit down together once, ideally early in the second trimester, when there&apos;s still plenty of time.
          </p>
          <ol className="list-decimal space-y-2.5 pl-5">
            <li>
              <strong>List the jobs.</strong> Start from our{" "}
              <Link href={GUIDES.partnerChecklist.path}>partner pregnancy checklist</Link> and the{" "}
              <Link href={GUIDES.hospitalBag.path}>hospital bag checklist</Link>, then add anything that&apos;s yours
              alone. Group tasks into jobs: &ldquo;childcare&rdquo;, not &ldquo;call three daycares&rdquo;.
            </li>
            <li>
              <strong>Pick one owner per job.</strong> Go by interest, by schedule (who can make calls during work hours)
              and by what&apos;s already on each plate. Prenatal appointments belong to the birthing parent, but the
              partner can own everything around them, from the shared calendar to the drive there.
            </li>
            <li>
              <strong>Mark the joint decisions.</strong> Some choices belong to both of you: the name, the budget,
              who&apos;s at the birth and visitors after it. Decide those together, and give one person the job of
              putting the conversation on the calendar.
            </li>
            <li>
              <strong>Give every job a &ldquo;done by&rdquo; week.</strong> The table below is a starting point.
            </li>
            <li>
              <strong>Check in for 10 minutes a week.</strong> Each owner says what&apos;s done and what&apos;s next.
              Rebalance when energy or work changes, for example by moving more jobs to the partner late in pregnancy.
            </li>
          </ol>
        </Prose>

        <h2 className={h2}>A starting split</h2>
        <Prose className="mt-4">
          <p>
            Change anything that doesn&apos;t fit your life. The weeks match our{" "}
            <Link href={GUIDES.partnerChecklist.path}>partner pregnancy checklist</Link>.
          </p>
        </Prose>

        <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full border-collapse text-left text-[15px]">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-line bg-canvas/60 text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3 font-semibold">Job</th>
                <th className="px-5 py-3 font-semibold">Done by</th>
                <th className="px-5 py-3 font-semibold">Suggested owner</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {JOBS.map((row) => (
                <tr key={row.job} className="block border-b border-line last:border-0 sm:table-row">
                  <td className="block px-5 pt-4 pb-1 font-semibold sm:table-cell sm:px-5 sm:py-3 sm:font-normal">
                    <span className="mb-1 block text-[10px] font-semibold tracking-wide text-muted uppercase sm:hidden">
                      Job
                    </span>
                    {row.job}
                  </td>
                  <td className="block px-5 py-1 sm:table-cell sm:px-5 sm:py-3">
                    <span className="mr-1 text-[10px] font-semibold tracking-wide text-muted uppercase sm:hidden">
                      Done by
                    </span>
                    <span className="whitespace-nowrap sm:whitespace-normal lg:whitespace-nowrap">{row.week}</span>
                  </td>
                  <td className="block px-5 pt-1 pb-4 text-muted sm:table-cell sm:px-5 sm:py-3 sm:text-ink">
                    <span className="mr-1 text-[10px] font-semibold tracking-wide text-muted uppercase sm:hidden">
                      Suggested owner
                    </span>
                    {row.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <p>
            The{" "}
            <a
              href={SOURCES.aapPediatrician.url}
              target="_blank"
              rel="noopener"
              className="font-semibold text-brand-strong underline underline-offset-2"
            >
              American Academy of Pediatrics
            </a>{" "}
            encourages parents-to-be to visit a pediatrician during the third trimester.
          </p>
          <p>
            Have the car seat checked once it&apos;s in. In most cases a certified technician checks it for free, and{" "}
            <a
              href={SOURCES.nhtsaCarSeats.url}
              target="_blank"
              rel="noopener"
              className="font-semibold text-brand-strong underline underline-offset-2"
            >
              NHTSA&apos;s website
            </a>{" "}
            shows where to find one near you.
          </p>
        </div>

        <h2 className={h2}>Print the sheet</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <GuidePrintButton>Print this sheet</GuidePrintButton>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            A one-page who-owns-what sheet with these jobs, an owner and a &ldquo;done by&rdquo; week for each, and space
            for your own. No sign-up needed.
          </p>
        </div>
      </div>

      <section className="mt-8 print:mt-0" aria-label="Printable who-owns-what sheet">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-sm sm:p-7 print:overflow-visible print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="border-b border-ink/15 pb-3 print:pb-2">
            <h3 className="font-display text-xl font-semibold sm:text-2xl print:text-[17pt]">
              Who owns what: our pregnancy jobs
            </h3>
            <p className="mt-1 text-sm text-muted print:mt-0.5 print:text-[9.5pt] print:text-black">
              One owner per job, from noticing to done.
            </p>
          </div>

          <table className="mt-3 w-full table-fixed border-collapse text-left leading-tight print:mt-2 print:text-[9.5pt]">
            <colgroup>
              <col className="w-[46%]" />
              <col className="w-[27%]" />
              <col className="w-[18%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-ink/20 text-[10px] font-semibold tracking-wide text-muted uppercase print:text-[8pt] print:text-black">
                <th className="py-1.5 pr-2 align-bottom print:py-1">Job</th>
                <th className="py-1.5 pr-2 align-bottom print:py-1">
                  Owner
                  <span className="block text-[8px] font-normal tracking-normal normal-case print:text-[7pt]">
                    Tick one: Me, Partner, Together
                  </span>
                </th>
                <th className="py-1.5 pr-2 align-bottom print:py-1">Done by week</th>
                <th className="py-1.5 align-bottom print:py-1">Done</th>
              </tr>
            </thead>
            <tbody>
              {JOBS.map((row) => (
                <tr key={row.job} className="border-b border-ink/10 align-top print:break-inside-avoid">
                  <td className="py-2 pr-2 text-[12px] font-medium sm:text-sm print:py-1.5 print:text-[9.5pt]">
                    {row.job}
                  </td>
                  <td className="py-2 pr-2 print:py-1.5">
                    <OwnerTicks />
                  </td>
                  <td className="py-2 pr-2 text-[11px] sm:text-xs print:py-1.5 print:text-[9pt]">{row.week}</td>
                  <td className="py-2 print:py-1.5">
                    <span
                      className="inline-block size-3.5 border border-ink/50 print:size-3 print:border-black"
                      aria-hidden
                    />
                  </td>
                </tr>
              ))}
              {BLANK_ROWS.map((row) => (
                <tr key={`blank-${row}`} className="border-b border-ink/10 align-top print:break-inside-avoid">
                  <td className="h-8 py-2 pr-2 print:h-[22pt] print:py-1.5" />
                  <td className="py-2 pr-2 print:py-1.5">
                    <OwnerTicks />
                  </td>
                  <td className="h-8 py-2 pr-2 print:h-[22pt] print:py-1.5" />
                  <td className="py-2 print:py-1.5">
                    <span
                      className="inline-block size-3.5 border border-ink/50 print:size-3 print:border-black"
                      aria-hidden
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink/15 pt-2 text-[11px] text-muted print:mt-2 print:text-[9pt] print:text-black">
            <span>Our weekly check-in day: ________</span>
            <span aria-hidden className="text-ink/30 print:text-black">
              ·
            </span>
            <span>dueduo.com</span>
          </div>
        </div>
      </section>

      <div className="print:hidden">
        <h2 className={h2}>If one of you is already carrying most of it</h2>
        <Prose className="mt-4">
          <p>Start with a short ask, without blame, then do the 20-minute split together.</p>
          <ul className="list-disc space-y-2.5 pl-5">
            <li>
              <strong>From the person holding the list:</strong> &ldquo;I&apos;ve got a lot of the planning in my head.
              Can we sit down for 20 minutes this weekend and split it, so we each own some whole jobs?&rdquo;
            </li>
            <li>
              <strong>From the partner:</strong> &ldquo;Which jobs can I take off your plate completely, start to
              finish?&rdquo;
            </li>
          </ul>
        </Prose>

        <h2 className={h2}>Keep going</h2>
        <Prose className="mt-4">
          <ul className="list-disc space-y-2.5 pl-5">
            <li>
              <Link href={GUIDES.partnerChecklist.path}>The partner pregnancy checklist</Link>: every partner job, week
              by week
            </li>
            <li>
              <Link href={GUIDES.hospitalBag.path}>Hospital bag checklist for two</Link>
            </li>
            <li>
              <Link href={GUIDES.leaveCalculator.path}>Parental leave calculator</Link>
            </li>
            <li>
              <Link href={GUIDES.messages.path}>How to tell family and work</Link>
            </li>
          </ul>
        </Prose>

        <GuideCta guide={guide}>
          Want the split done for you? In DueDuo, each week shows what to book, buy and decide, already split between
          both of you.
        </GuideCta>
        <p className="mt-6 text-sm italic text-muted">
          This guide is general planning information, not medical or legal advice. For anything about your health or your
          baby&apos;s, ask your doctor or midwife.
        </p>
        <Sources sources={[SOURCES.daminger, SOURCES.aapPediatrician, SOURCES.nhtsaCarSeats]} />
      </div>
    </article>
  );
}
