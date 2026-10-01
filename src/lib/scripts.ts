/* =========================================================
   Boundary Scripts — ready-to-send WhatsApp messages.
   Placeholders: {{myName}} {{partnerName}} {{dueMonth}} {{hospital}}
   ========================================================= */

export type ScriptId =
  | "partner-invite"
  | "tell-family"
  | "keep-it-private"
  | "tell-work"
  | "partner-tell-work"
  | "unsolicited-advice"
  | "hand-me-downs"
  | "gift-preferences"
  | "meal-train"
  | "labor-updates"
  | "no-hospital-visitors"
  | "home-visiting-rules";

export type ScriptCategory = "partner" | "family" | "work" | "money" | "visitors";

export type BoundaryScript = {
  id: ScriptId;
  title: string;
  category: ScriptCategory;
  /** Who sends it. */
  sender: "mom" | "partner" | "either";
  /** When it's most useful — shown under the title. */
  when: string;
  body: string;
  /** Coaching line shown under the message. */
  tip?: string;
};

export type ScriptVars = {
  myName?: string | null;
  partnerName?: string | null;
  dueMonth?: string | null;
  hospital?: string | null;
};

export const SCRIPT_CATEGORY_LABELS: Record<ScriptCategory, string> = {
  partner: "Your partner",
  family: "Family & friends",
  work: "Work",
  money: "Gifts & money",
  visitors: "Visitors & birth",
};

export const SCRIPTS: Record<ScriptId, BoundaryScript> = {
  "partner-invite": {
    id: "partner-invite",
    title: "Invite your partner as Co-Pilot",
    category: "partner",
    sender: "mom",
    when: "Right after setup",
    body:
      "Hey {{partnerName}} 💛 I set up our pregnancy planner. There's a list of tasks just for you — so I don't have to remember everything. Join me here: {{inviteLink}}",
    tip: "Frame it as teamwork, not homework. Partners follow through more when the tasks are clearly theirs.",
  },
  "tell-family": {
    id: "tell-family",
    title: "Share the news with close family",
    category: "family",
    sender: "either",
    when: "When you're ready to tell your inner circle",
    body:
      "We have some news… we're expecting a baby in {{dueMonth}}! 🤍 We're telling just a few people for now, so please keep it between us until we share it more widely. We love you!",
  },
  "keep-it-private": {
    id: "keep-it-private",
    title: "Please don't post about it yet",
    category: "family",
    sender: "either",
    when: "If someone might share the news before you do",
    body:
      "We're so happy you're excited with us! One small favor — please don't post or share the news yet. We'd love to announce it ourselves when the time is right. Thank you for understanding 🙏",
  },
  "tell-work": {
    id: "tell-work",
    title: "Tell your manager",
    category: "work",
    sender: "mom",
    when: "Once you've decided your timing (check your legal notice deadline)",
    body:
      "Hi, could we find 15 minutes this week for a private chat? I have some personal news to share, and I'd like to plan ahead together so the team is fully covered.",
    tip: "Use this to book the meeting — share the news in person. Afterwards, confirm dates in writing by email and keep a copy.",
  },
  "partner-tell-work": {
    id: "partner-tell-work",
    title: "Partner: request parental leave",
    category: "work",
    sender: "partner",
    when: "Second trimester, once the due date is confirmed",
    body:
      "Hi, I wanted to let you know early that my partner and I are expecting a baby in {{dueMonth}}. I plan to take parental leave around that time, and I'll prepare a handover plan well in advance. Can we set up time to go over the dates?",
  },
  "unsolicited-advice": {
    id: "unsolicited-advice",
    title: "Kindly stop unsolicited advice",
    category: "family",
    sender: "mom",
    when: "When the tips and horror stories start piling up",
    body:
      "I know it comes from love, and I really appreciate you caring! We're following our doctor's guidance and figuring out what works for us, so we'll ask if we need ideas 😊",
    tip: "Warm first, firm second. You don't owe anyone a debate.",
  },
  "hand-me-downs": {
    id: "hand-me-downs",
    title: "Ask for hand-me-downs",
    category: "money",
    sender: "either",
    when: "Before buying any big-ticket gear",
    body:
      "Hi! We're getting ready for baby in {{dueMonth}} and trying to avoid buying everything new. If you have any baby things you no longer need (clothes 0–3m, bouncer, carrier, bottles…), we'd happily take them off your hands! 💛",
    tip: "Never accept a second-hand car seat unless you know its full history, and check crib and bassinet safety standards.",
  },
  "gift-preferences": {
    id: "gift-preferences",
    title: "Guide gifts toward what you need",
    category: "money",
    sender: "either",
    when: "When people ask 'what do you need?'",
    body:
      "Thank you so much for asking! 🤍 Our registry has the things we really need: {{registryLink}}. Honestly, a home-cooked meal after the baby arrives would be the best gift of all.",
  },
  "meal-train": {
    id: "meal-train",
    title: "Set up a meal train",
    category: "money",
    sender: "partner",
    when: "Weeks 32–36",
    body:
      "Hi friends! {{myName}} is due in {{dueMonth}}. Instead of gifts, the most helpful thing for the first weeks would be a meal drop-off. If you'd like to help, reply with a date that works for you and we'll coordinate so there are no doubles. Thank you! 🍲",
  },
  "labor-updates": {
    id: "labor-updates",
    title: "No calls during labor, please",
    category: "visitors",
    sender: "partner",
    when: "Send to family around week 37",
    body:
      "Quick heads-up: when labor starts, we'll be switching our phones off to focus. Please don't worry if you don't hear from us — we'll message as soon as baby is here and we're ready to share. Thank you for giving us that space 💛",
  },
  "no-hospital-visitors": {
    id: "no-hospital-visitors",
    title: "No hospital visitors",
    category: "visitors",
    sender: "partner",
    when: "Week 36–37, before anyone makes plans",
    body:
      "We've decided to keep the hospital time just for the three of us, so we can rest and get to know our baby. We can't wait for you to meet them once we're settled at home — we'll let you know when we're ready for visits! 🤍",
    tip: "The partner sends this one. It takes pressure off the mom and makes the decision feel like 'ours'.",
  },
  "home-visiting-rules": {
    id: "home-visiting-rules",
    title: "Home visiting rules",
    category: "visitors",
    sender: "partner",
    when: "Before the first visitors come",
    body:
      "We'd love for you to meet the baby! A few things that help us a lot right now: please message before coming, keep visits short (about 30–45 min), wash hands when you arrive, and stay home if you're feeling unwell. Bringing a snack or helping with a small chore is the best gift 😊",
  },
};

/* ---------- Helpers ---------- */

/** Replaces {{key}} placeholders; unknown/missing values get a friendly fallback. */
export function renderScript(
  body: string,
  vars: ScriptVars & { inviteLink?: string; registryLink?: string },
): string {
  const fallbacks: Record<string, string> = {
    myName: "I",
    partnerName: "love",
    dueMonth: "a few months",
    hospital: "the hospital",
    inviteLink: "[link]",
    registryLink: "[registry link]",
  };
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = (vars as Record<string, string | null | undefined>)[key];
    return value && value.trim() ? value.trim() : (fallbacks[key] ?? "");
  });
}

/** Opens WhatsApp with the message prefilled (the user picks the contact). */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getScriptsByCategory(category: ScriptCategory): BoundaryScript[] {
  return Object.values(SCRIPTS).filter((s) => s.category === category);
}

/** "April 2027" from a "YYYY-MM-DD" due date. */
export function dueMonthLabel(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${dueDate}T00:00:00Z`),
  );
}
