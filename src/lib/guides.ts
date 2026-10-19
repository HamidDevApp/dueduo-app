import { SITE } from "@/lib/site-config";

/** Free public guides and tools (organic traffic). Copy is approved — keep it verbatim. */
export type Guide = {
  path: string;
  /** <title> without the " | DueDuo" suffix (added in guideMetadata). */
  title: string;
  description: string;
  h1: string;
  /** Card title on /guides, when it should be shorter than the H1. */
  cardTitle?: string;
  /** One line for the /guides index card. */
  blurb: string;
  kind: "Guide" | "Tool";
  published: string;
  /** Last content update ("YYYY-MM-DD"); defaults to `published`. */
  updated?: string;
};

/** Byline on every guide (E-E-A-T: a real person behind the content). */
export const AUTHOR = { name: "Hamid Ouchlah", role: "founder of DueDuo", path: "/about" } as const;

export const GUIDES = {
  hospitalBag: {
    path: "/guides/hospital-bag-checklist",
    title: "Hospital Bag Checklist for Two (Printable)",
    description:
      "A printable hospital bag checklist for both of you: what the birthing parent, the partner and the baby need, plus documents and what to leave at home.",
    h1: "Hospital bag checklist for two",
    blurb: "Three bags, one for each of you and one for the baby, plus what to leave at home.",
    kind: "Guide",
    published: "2026-10-14",
  },
  questions: {
    path: "/guides/prenatal-appointment-questions",
    title: "Prenatal Appointment Questions, by Trimester",
    description:
      "15 questions to ask your doctor or midwife, trimester by trimester, plus questions for the partner. Print them on one page for your next visit.",
    h1: "Questions to ask at your prenatal appointments",
    blurb: "15 questions by trimester, plus 5 for the partner, on one printable page.",
    kind: "Guide",
    published: "2026-10-14",
  },
  leaveCalculator: {
    path: "/tools/parental-leave-calculator",
    title: "Parental Leave Calculator: Income Gap & Savings",
    description:
      "Work out how much income you'll lose during parental leave, for both parents, and how much to save each month before the due date. Free, no sign-up.",
    h1: "Parental leave calculator",
    blurb: "Your leave income gap for both parents, and what to save each month.",
    kind: "Tool",
    published: "2026-10-14",
  },
  partnerChecklist: {
    path: "/guides/partner-pregnancy-checklist",
    title: "The Partner's Pregnancy To-Do List, Week by Week",
    description:
      "27 jobs for the partner, from booking the first appointment to installing the car seat, sorted by week, plus the jobs you do together. Printable.",
    h1: "The partner's pregnancy to-do list",
    blurb:
      "27 jobs for the partner, from booking the first appointment to installing the car seat, sorted by week, plus the jobs you do together. Printable.",
    kind: "Guide",
    published: "2026-10-14",
  },
  skipList: {
    path: "/guides/baby-items-you-dont-need",
    title: "Baby Things You Don't Need: 10 to Skip",
    description:
      "10 baby items you can skip or put off, two that are unsafe for sleep, and what's worth buying second-hand. A calmer, cheaper first baby list.",
    h1: "Baby things you can skip",
    blurb:
      "10 baby items you can skip or put off, two that are unsafe for sleep, and what's worth buying second-hand. A calmer, cheaper first baby list.",
    kind: "Guide",
    published: "2026-10-14",
  },
  messages: {
    path: "/guides/how-to-tell-family-and-work",
    title: "How to Tell Family and Work You're Expecting",
    description:
      "Ready-to-copy messages for telling family, your manager and your partner's work, plus messages for privacy, labor updates and visitors.",
    h1: "How to tell family and work: messages you can copy",
    blurb:
      "Ready-to-copy messages for telling family, your manager and your partner's work, plus messages for privacy, labor updates and visitors.",
    kind: "Guide",
    published: "2026-10-14",
  },
  bossNews: {
    path: "/guides/how-to-tell-your-boss-youre-pregnant",
    title: "How to Tell Your Boss You're Pregnant: Email and Script Templates",
    description:
      "When to tell work, what to say in the meeting, and the follow-up email, plus a version for the partner. Copy the templates and make them yours.",
    h1: "How to tell your boss you're pregnant",
    blurb:
      "When to tell work, what to say in the meeting, and the follow-up email, plus a version for the partner. Copy the templates and make them yours.",
    kind: "Guide",
    published: "2026-10-19",
  },
  splitList: {
    path: "/guides/split-pregnancy-to-do-list",
    title: "How to Split the Pregnancy To-Do List With Your Partner",
    description:
      "Own whole jobs, not chores. A 20-minute way for expecting couples to split pregnancy planning, plus a free printable who-owns-what sheet.",
    h1: "How to split the pregnancy to-do list with your partner",
    cardTitle: "Split the pregnancy to-do list",
    blurb: "Own whole jobs, not chores: a 20-minute split and a printable sheet.",
    kind: "Guide",
    published: "2026-10-19",
    updated: "2026-10-19",
  },
} satisfies Record<string, Guide>;

export const GUIDE_LIST: Guide[] = Object.values(GUIDES);

/**
 * Which guide a purchase started from: the last part of the guide's address, e.g. "hospital-bag-checklist".
 * Carried in the "Start our plan" link → checkout → Polar metadata → payments.source. No cookies.
 */
export const guideSource = (g: Guide) => g.path.split("/").pop()!;
const GUIDE_SOURCES = new Set(GUIDE_LIST.map(guideSource));

/** Only our own guide names are accepted (anything else is dropped). */
export function parseGuideSource(value: unknown): string | null {
  return typeof value === "string" && GUIDE_SOURCES.has(value) ? value : null;
}


export type Source = { n: number; title: string; url: string };

export const SOURCES = {
  tommys: {
    n: 1,
    title: "Tommy's: Packing your bag for labour and birth",
    url: "https://www.tommys.org/pregnancy-information/giving-birth/packing-hospital-bag",
  },
  kaiser: {
    n: 2,
    title: "Kaiser Permanente: Transportation home",
    url: "https://georgia.kaiserpermanente.org/maternity/labor-birth/transportation-home/",
  },
  nichd: {
    n: 3,
    title: "NICHD: What happens during prenatal visits?",
    url: "https://www.nichd.nih.gov/health/topics/preconceptioncare/conditioninfo/prenatal-visits",
  },
  nhs: {
    n: 4,
    title: "NHS: Your antenatal appointments",
    url: "https://www.nhs.uk/pregnancy/your-pregnancy-care/your-antenatal-appointments/",
  },
  aapSafeSleep: {
    n: 5,
    title: "American Academy of Pediatrics (HealthyChildren.org), a parent's guide to safe sleep",
    url: "https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx",
  },
  cpscBans: {
    n: 6,
    title: "US Consumer Product Safety Commission, bans on inclined sleepers and crib bumpers",
    url: "https://cpsc.gov/Newsroom/News-Releases/2023/CPSC-Approves-Rules-Implementing-Bans-on-Inclined-Sleepers-for-Infants-and-Crib-Bumpers",
  },
  consumerReportsCarSeats: {
    n: 7,
    title: "Consumer Reports, are second-hand car seats safe",
    url: "https://www.consumerreports.org/car-seats/are-secondhand-car-seats-safe",
  },
  govMaternity: {
    n: 8,
    title: "GOV.UK, Maternity Leave: how to claim",
    url: "https://www.gov.uk/maternity-leave/how-to-claim",
  },
  govPaternity: {
    n: 9,
    title: "GOV.UK, Paternity Leave: how to claim",
    url: "https://www.gov.uk/paternity-pay-leave/how-to-claim",
  },
  dolFmla: {
    n: 10,
    title: "U.S. Department of Labor, Fact Sheet #28: The Family and Medical Leave Act",
    url: "https://www.dol.gov/agencies/whd/fact-sheets/28-fmla",
  },
  dolFmlaNotice: {
    n: 11,
    title: "U.S. Department of Labor, Fact Sheet #28E: Requesting leave under the FMLA",
    url: "https://www.dol.gov/agencies/whd/fact-sheets/28e-fmla-employee-notice",
  },
  eeocPwfa: {
    n: 12,
    title: "U.S. EEOC, What you should know about the Pregnant Workers Fairness Act",
    url: "https://www.eeoc.gov/wysk/what-you-should-know-about-pregnant-workers-fairness-act",
  },
  canadaEi: {
    n: 13,
    title: "Government of Canada, EI maternity and parental benefits",
    url: "https://www.canada.ca/en/services/benefits/ei/ei-maternity-parental.html",
  },
  fairWork: {
    n: 14,
    title: "Fair Work Ombudsman (Australia), Maternity and parental leave",
    url: "https://www.fairwork.gov.au/leave/maternity-and-parental-leave",
  },
  daminger: {
    n: 15,
    title: "Allison Daminger, \"The Cognitive Dimension of Household Labor\", American Sociological Review, 2019",
    url: "https://inequality.hks.harvard.edu/publications/cognitive-dimension-household-labor",
  },
  aapPediatrician: {
    n: 16,
    title:
      "American Academy of Pediatrics (HealthyChildren.org), \"Expectant Parents Encouraged to Visit Pediatrician Before Birth of Baby\"",
    url: "https://healthychildren.org/English/news/Pages/Expectant-Parents-Encouraged-to-Visit-Pediatrician-Before-Birth-of-Baby.aspx",
  },
  nhtsaCarSeats: {
    n: 17,
    title: "NHTSA, \"Car Seats and Booster Seats\"",
    url: "https://www.nhtsa.gov/equipment/car-seats-and-booster-seats",
  },
} satisfies Record<string, Source>;

/** Page metadata: exact approved <title>, description, canonical and share card. */
export function guideMetadata(g: Guide) {
  return {
    title: { absolute: `${g.title} | ${SITE.name}` },
    description: g.description,
    alternates: { canonical: g.path },
    openGraph: { title: g.h1, description: g.description, url: g.path, siteName: SITE.name, type: "article" as const },
    twitter: { card: "summary_large_image" as const },
  };
}

/** BreadcrumbList + Article. Planning content only: no ratings, reviews or medical claims. */
export function guideJsonLd(g: Guide) {
  const url = `${SITE.url}${g.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: `${SITE.url}/` },
          { "@type": "ListItem", position: 2, name: "Free guides", item: `${SITE.url}/guides` },
          { "@type": "ListItem", position: 3, name: g.h1, item: url },
        ],
      },
      {
        "@type": "Article",
        headline: g.h1,
        description: g.description,
        url,
        mainEntityOfPage: url,
        datePublished: g.published,
        dateModified: g.updated ?? g.published,
        author: { "@type": "Person", name: AUTHOR.name, url: `${SITE.url}${AUTHOR.path}` },
        publisher: {
          "@type": "Organization",
          "@id": `${SITE.url}/#organization`,
          name: SITE.name,
          url: SITE.url,
          logo: `${SITE.url}/brand/dueduo-icon-512.png`,
        },
      },
    ],
  };
}
