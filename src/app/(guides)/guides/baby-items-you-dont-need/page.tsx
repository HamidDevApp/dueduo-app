import type { Metadata } from "next";
import { Checklist, type ChecklistGroup } from "@/components/guides/checklist";
import { GuideCta, GuideHeader, Prose, SourceLink, Sources } from "@/components/guides/guide-parts";
import { GuidePrintButton } from "@/components/guides/print-button";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.skipList;
export const metadata: Metadata = guideMetadata(guide);

const SKIP: [string, string][] = [
  ["Wipe warmer.", "Babies don't need warm wipes."],
  ["Baby shoes before walking.", "Socks do the job."],
  ["Special baby laundry detergent.", "Any fragrance-free, dye-free detergent works."],
  ["A dedicated changing table.", "A changing pad (changing mat) on a sturdy dresser (chest of drawers) does the same job."],
  ["Lots of newborn-size clothes.", "Buy a few, then go straight to 0 to 3 months."],
  ["Baby food maker.", "Solids start months later, and a blender or a fork works."],
  ["Designer diaper bag (nappy bag).", "Any backpack with pockets will do."],
  ["Matching nursery furniture sets.", "Your baby needs a safe place to sleep, not a matching set."],
];

const NEED: ChecklistGroup[] = [
  {
    id: "before",
    title: "Before the birth",
    items: [
      "Infant car seat (new, or second-hand only with its full history)",
      "Crib (cot) or bassinet (Moses basket) with a firm, flat mattress",
      "Fitted sheets x3",
      "Sleep sacks (baby sleeping bags) or swaddles x3",
      "Bodysuits (vests) and sleepsuits in 0 to 3 months (second-hand is fine)",
      "Diapers (nappies) and wipes for the first month",
      "Feeding basics",
      "Stroller (pushchair) or carrier (second-hand is fine)",
      "Thermometer, nail clippers and saline drops",
      "Postpartum recovery supplies for the birthing parent",
    ],
  },
  {
    id: "nice",
    title: "Nice to have, after the baby shower or the first few weeks",
    items: ["Baby monitor", "Bouncer (borrow one if you can)", "Changing pad on a dresser you already have", "Nursing pillow"],
  },
];

const h2 = "font-display text-2xl font-semibold tracking-tight";
const h3 = "font-display text-xl font-semibold";
const list = "mt-4 list-disc space-y-2.5 pl-5 text-lg leading-relaxed text-ink/85 [&_a]:font-semibold [&_a]:text-brand-strong [&_a]:underline [&_a]:underline-offset-2";

export default function SkipListPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16 print:max-w-none print:p-0">
      <GuideHeader guide={guide} />

      <div className="print:hidden">
        <Prose className="mt-6">
          <p>
            Baby lists are long, and a lot of what&apos;s on them is optional. Here are 10 things you can skip or put off,
            plus what&apos;s worth buying second-hand and the short list of what you&apos;ll actually use early on. Two
            of the 10 aren&apos;t just unnecessary: they aren&apos;t safe for a sleeping baby. It&apos;s the same guide
            DueDuo uses for your shared baby budget.
          </p>
        </Prose>

        <aside className="mt-10 rounded-r-[var(--radius-card)] border-l-4 border-brand-strong bg-brand-soft p-6">
          <h2 className={h3}>Two to keep out of the crib (cot) entirely</h2>
          <ul className={list}>
            <li>
              <strong>Crib bumpers, pillows and loose blankets.</strong>{" "}
              <SourceLink source={SOURCES.aapSafeSleep}>Safe-sleep guidance from the American Academy of Pediatrics</SourceLink>{" "}
              says the crib (cot) should hold only a firm, flat mattress and a fitted sheet. Padded crib bumpers have been{" "}
              <SourceLink source={SOURCES.cpscBans}>banned for sale in the US</SourceLink> since November 2022.
            </li>
            <li>
              <strong>Sleep positioners and inclined sleepers.</strong> Babies should sleep flat on their back. The
              American Academy of Pediatrics says sleep products with an incline of more than 10 degrees aren&apos;t safe,
              and inclined infant sleepers are also <SourceLink source={SOURCES.cpscBans}>banned for sale in the US</SourceLink>.
            </li>
          </ul>
        </aside>

        <section className="mt-10">
          <h3 className={h3}>Eight more you can skip or put off</h3>
          <ul className={list}>
            {SKIP.map(([item, reason]) => (
              <li key={item}>
                <strong>{item}</strong> {reason}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className={h2}>What&apos;s worth buying second-hand</h2>
          <ul className={list}>
            <li>Great second-hand: clothes, bouncers, carriers, strollers (pushchairs), books and toys.</li>
            <li>
              Check any second-hand gear against official recall lists, such as{" "}
              <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener">
                cpsc.gov/Recalls
              </a>{" "}
              in the US.
            </li>
            <li>
              <SourceLink source={SOURCES.consumerReportsCarSeats}>
                Avoid a second-hand car seat unless you know its full history
              </SourceLink>
              : never in a crash, not past its expiry date, with all its parts and labels, and not recalled.
            </li>
          </ul>
        </section>
      </div>

      <section className="mt-12 print:mt-3">
        <h2 className={`${h2} print:text-[12pt]`}>What you do need</h2>
        <div className="mt-5 print:mt-0">
          <Checklist groups={NEED} layout="stages" headingLevel={3} />
        </div>
      </section>

      <div className="mt-8 print:hidden">
        <GuidePrintButton>Print the starter list</GuidePrintButton>
      </div>

      <GuideCta>
        DueDuo&apos;s shared baby budget sorts every item into Essential, Nice to have or Skip, with where you&apos;ll get
        it (new, second-hand or borrowed) and the week to buy it by. You both see the same list, and anything you skip
        shows as money you kept.
      </GuideCta>
      <Sources sources={[SOURCES.aapSafeSleep, SOURCES.cpscBans, SOURCES.consumerReportsCarSeats]} />
    </article>
  );
}
