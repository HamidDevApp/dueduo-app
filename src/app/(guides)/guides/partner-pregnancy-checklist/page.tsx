import type { Metadata } from "next";
import { Checklist, Segments, type ChecklistGroup, type Segment } from "@/components/guides/checklist";
import { GuideCta, GuideHeader, Prose, Sources } from "@/components/guides/guide-parts";
import { GuidePrintButton } from "@/components/guides/print-button";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.partnerChecklist;
export const metadata: Metadata = guideMetadata(guide);

const MESSAGES = GUIDES.messages.path;
const BAGS = GUIDES.hospitalBag.path;
const CALCULATOR = GUIDES.leaveCalculator.path;

const STAGES: ChecklistGroup[] = [
  {
    id: "w0",
    title: "Weeks 0 to 6",
    items: [
      "Book the first prenatal appointment. First visits usually happen around weeks 8 to 10, and slots fill up.",
      "If you have health insurance, check what it covers for prenatal care, scans, the birth and the newborn.",
    ],
  },
  {
    id: "w7",
    title: "Weeks 7 to 8",
    items: [
      "Take over the strong-smell chores: cooking, bins and the fridge. If you have a cat, take over the litter box too, because cat litter can carry toxoplasmosis, which is risky in pregnancy.",
      "Book time off to join the first visit, and put every appointment in a shared calendar.",
    ],
  },
  {
    id: "w11",
    title: "Weeks 11 to 13",
    items: [["Ask family and friends ", { text: "not to post the news", href: MESSAGES }, " before you announce it."]],
  },
  {
    id: "w14",
    title: "Weeks 14 to 16",
    items: [
      "Research childcare and join waitlists. In some areas they're many months long. Note what each option costs.",
    ],
  },
  {
    id: "w17",
    title: "Weeks 17 to 19",
    items: [
      "Book the anatomy scan, usually at 18 to 22 weeks.",
      "Book antenatal and baby-care classes. Popular classes fill fast, and most people take them between weeks 28 and 36.",
    ],
  },
  {
    id: "w20",
    title: "Weeks 20 to 22",
    items: [
      "Request your parental leave. Tell your employer and agree dates now, so it isn't a last-minute scramble.",
      "Ask friends with older babies for hand-me-downs before buying anything.",
      "Price the big items: stroller, car seat and crib. Decide what to buy new and what second-hand.",
    ],
  },
  {
    id: "w23",
    title: "Weeks 23 to 25",
    items: [
      "Choose a pediatrician or family doctor for the baby. Check they're taking new patients.",
      "If a glucose test is offered, book it (usually at 24 to 28 weeks) and ask whether fasting is needed.",
    ],
  },
  {
    id: "w28",
    title: "Weeks 28 to 30",
    items: [
      "Add the more frequent appointments to the shared calendar. Visits often move to every 2 weeks or so now.",
    ],
  },
  {
    id: "w31",
    title: "Weeks 31 to 33",
    items: [
      "Pre-register at the hospital or birth center, and do the tour if you haven't.",
      "Buy and install the car seat. Follow the manual exactly, and have it checked by a certified technician if you can.",
      "Wash baby clothes and bedding in a fragrance-free detergent.",
      "Set up a meal train so friends and family can drop off food in the first weeks.",
    ],
  },
  {
    id: "w34",
    title: "Weeks 34 to 35",
    items: [
      "Plan the route to the hospital and a backup. Know where to park and which entrance to use at night.",
      ["Tell family your ", { text: "hospital visitor plan", href: MESSAGES }, " before anyone makes travel plans."],
      "Arrange care for pets or other children, with a backup person available at any hour.",
    ],
  },
  {
    id: "w36",
    title: "Week 36",
    items: [
      "Set up a recovery station by the bed: maternity pads, a peri bottle, comfy underwear, nipple cream, snacks and water.",
      "Save key numbers in both phones: the labor ward, your doctor or midwife, the pediatrician, lactation support and a backup driver.",
    ],
  },
  {
    id: "w37",
    title: "Weeks 37 to 39",
    items: [
      ["Ask family to wait for your news, with ", { text: "no calls during labor", href: MESSAGES }, "."],
      ["Send your ", { text: "home visiting rules", href: MESSAGES }, "."],
      "Find the deadline for adding the baby to your health insurance. In the US, many plans give you about 30 days after the birth.",
      ["Do a final check of ", { text: "the bags", href: BAGS }, " and the car seat."],
    ],
  },
];

const TOGETHER: Segment[][] = [
  [
    "Weeks 9 to 10: ",
    { text: "set up your baby budget", href: CALCULATOR },
    ", and read both parental leave policies for notice deadlines and pay.",
  ],
  [
    "Weeks 26 to 27: agree who does what after the birth: night feeds, leave dates, chores, pets and visitors. Write it down and review it at week 36.",
  ],
  ["Weeks 28 to 30: draft your birth preferences."],
  ["Weeks 34 to 35: ", { text: "pack the hospital bags", href: BAGS }, "."],
  ["Weeks 37 to 39: ask your doctor or midwife exactly when to call or come in, and write it down."],
];

export default function PartnerChecklistPage() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16 print:max-w-none print:p-0">
      <GuideHeader guide={guide} />
      <Prose className="mt-6 print:hidden">
        <p>
          Pregnancy planning can easily land on one person. This list gives the partner their own jobs, stage by stage,
          so the birthing parent isn&apos;t the only one remembering. It&apos;s the partner&apos;s half of the DueDuo
          plan: 27 jobs, plus a few you do together.
        </p>
        <p>
          <strong>How to use it:</strong> the partner owns each job from start to finish. Book it, add it to your shared
          calendar, and say when it&apos;s done.
        </p>
      </Prose>

      <div className="mt-10 print:mt-3">
        <Checklist groups={STAGES} layout="stages" headingLevel={3} />
      </div>

      <section className="mt-10 break-inside-avoid rounded-[var(--radius-card)] border border-sage/30 bg-sage-soft/60 p-6 print:mt-2 print:rounded-none print:border-0 print:bg-transparent print:p-0">
        <h3 className="font-display text-lg font-semibold print:text-[10.5pt]">Do these together</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-snug text-ink/85 print:mt-1 print:space-y-0.5 print:text-[9.5pt]">
          {TOGETHER.map((parts, n) => (
            <li key={n}>
              <Segments parts={parts} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 print:hidden">
        <GuidePrintButton>Print the partner&apos;s list</GuidePrintButton>
      </div>

      <GuideCta>
        In DueDuo, the partner gets their own login and their own task list, week by week. You both see what&apos;s
        done, so nobody has to ask. The partner joins free.
      </GuideCta>
      <Sources
        sources={[
          { n: 1, title: "NICHD (US National Institutes of Health), prenatal visits", url: SOURCES.nichd.url },
          { n: 2, title: "NHS, your antenatal appointments", url: SOURCES.nhs.url },
          { n: 3, title: "Kaiser Permanente, getting home and car seats", url: SOURCES.kaiser.url },
        ]}
      />
    </article>
  );
}
