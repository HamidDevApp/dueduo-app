import type { Metadata } from "next";
import { Checklist, type ChecklistGroup } from "@/components/guides/checklist";
import { GuideCta, GuideHeader, Prose, SourceLink, Sources } from "@/components/guides/guide-parts";
import { GuidePrintButton } from "@/components/guides/print-button";
import { GUIDES, SOURCES, guideMetadata } from "@/lib/guides";

const guide = GUIDES.hospitalBag;
export const metadata: Metadata = guideMetadata(guide);

const BAGS: ChecklistGroup[] = [
  {
    id: "birthing-parent",
    title: "The birthing parent's bag",
    items: [
      "Photo ID, insurance card and hospital papers (in the UK, your maternity notes)",
      "Birth plan (2 copies)",
      "Phone and a long charging cable",
      "Comfortable robe and slippers",
      "1 or 2 loose nightgowns or big T-shirts for labor",
      "Front-opening tops for skin-to-skin and feeding",
      "Nursing bras and breast pads",
      "Maternity pads and high-waist underwear",
      "Toiletries, lip balm, hair ties",
      "Any medicines you take, in their original packaging",
      "Glasses or contact lens case",
      "Loose going-home outfit",
    ],
  },
  {
    id: "partner",
    title: "The partner's bag",
    items: [
      "Snacks and a water bottle for both of you",
      "Change of clothes, spare underwear and a toothbrush, in case you stay overnight",
      "Phone charger or power bank",
      "Pillow and blanket",
      "Card or cash for parking and vending machines",
      "The hospital's address and phone number, and the route there",
      "Who to text once the baby arrives, and who tells whom",
      "A spare copy of the birth plan",
    ],
  },
  {
    id: "baby",
    title: "The baby's bag",
    items: [
      [
        "Car seat, rear-facing and installed in the car before the due date. ",
        { text: "Hospital staff usually can't install it for you.", href: SOURCES.kaiser.url },
      ],
      "2 or 3 bodysuits and sleepsuits",
      "Hat, socks and mittens",
      "Swaddle or receiving blanket",
      "Newborn diapers (nappies), plus wipes or cotton wool and water",
      "Going-home outfit, with a warm layer if it's cold",
      "Formula and bottles, only if you plan to bottle-feed. Ask whether your hospital provides them.",
    ],
  },
];

const LEAVE_AT_HOME = [
  "Jewelry and other valuables.",
  "Piles of baby clothes. Two or three changes are enough for a short stay.",
  "Towels and blankets for you. Many hospitals provide them, so check.",
  "Tampons. Use maternity pads after the birth.",
];

export default function HospitalBagChecklistPage() {
  return (
    <article className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 print:p-0">
      <div className="max-w-3xl">
        <GuideHeader guide={guide} />
        <Prose className="mt-6 print:hidden">
          <p>
            Aim to have your bags ready by week 36. Labor can start early, and the UK pregnancy charity{" "}
            <SourceLink source={SOURCES.tommys}>Tommy&apos;s</SourceLink> suggests packing no later than 37 weeks.
          </p>
          <p>
            This list splits the packing into three bags: one for the birthing parent, one for the partner and one for
            the baby. Split the work too. The partner packs their own bag and the baby&apos;s, the birthing parent packs
            theirs, then you swap and check each other&apos;s.
          </p>
        </Prose>
      </div>

      <div className="mt-10 print:mt-4">
        <Checklist groups={BAGS} />
      </div>

      <section className="mt-10 max-w-3xl break-inside-avoid print:mt-5">
        <h2 className="font-display text-xl font-semibold print:text-base">Leave at home</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/85 print:mt-1.5 print:space-y-0.5 print:text-[10.5pt]">
          {LEAVE_AT_HOME.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <div className="max-w-3xl">
        <Prose className="mt-8 print:mt-4 print:text-[10.5pt]">
          <p>Your hospital or birth center may have its own list. Ask at your next appointment.</p>
        </Prose>
        <div className="mt-6 print:hidden">
          <GuidePrintButton>Print this checklist</GuidePrintButton>
        </div>

        <GuideCta guide={guide}>
          In DueDuo, these bags live on both your phones. Each of you sees your own bag, you tick items off as you pack,
          and you can add your own. It&apos;s one part of a week-by-week plan for both of you.
        </GuideCta>
        <Sources sources={[SOURCES.tommys, SOURCES.kaiser]} />
      </div>
    </article>
  );
}
