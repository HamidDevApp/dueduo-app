import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { OutgoingEmail } from "@/lib/email";
import { SITE } from "@/lib/site-config";

/**
 * The onboarding emails (approved copy — keep it verbatim).
 *   welcome     → right after purchase (Polar webhook)
 *   co_pilot    → day 1, only if no partner has joined yet          ┐
 *   day2_setup  → day 2, only if no due date yet          ┐ one of  │
 *   day2_task   → day 2, only if nothing ticked yet        ┘ the two │ daily cron
 *   appointment → day 3                                              │ (/api/cron/onboarding-emails)
 *   budget      → day 7                                              │
 *   feedback    → day 10                                             ┘
 */
export type EmailKey =
  | "welcome"
  | "co_pilot"
  | "day2_setup"
  | "day2_task"
  | "appointment"
  | "budget"
  | "feedback";

/** Per-buyer values some templates fill in. */
export type TemplateVars = {
  /** Suggested quick task (day2_task); without one, the email asks them to pick the easiest. */
  taskTitle?: string | null;
  /** Partner's name when the partner has joined; null when they haven't (day2_task). */
  joinedPartnerName?: string | null;
};

export type Block =
  | { p: string }
  | { ol: string[] }
  | { ul: string[] }
  | { button: string; href: string }
  | { small: string };

export type Template = { subject: string; preview: string; blocks: Block[] };

const url = (path: string) => `${SITE.url}${path}`;

const TEMPLATES: Record<EmailKey, Template | ((v: TemplateVars) => Template)> = {
  welcome: {
    subject: "Your DueDuo plan is ready",
    preview: "Three things to do first. About 10 minutes.",
    blocks: [
      { p: "Welcome to DueDuo. Your plan is ready, and it's yours to keep: one payment, no subscription." },
      { p: "Start with these three things:" },
      {
        ol: [
          "Add your due date, so your roadmap shows this week's tasks.",
          "Invite your partner as your Co-Pilot. They get their own to-do list and join free.",
          "Tick off your first task. Your Today page suggests an easy one.",
        ],
      },
      { button: "Open my plan", href: url("/dashboard") },
      { p: "Stuck on anything? Just reply to this email. We read every reply." },
      {
        p: "You have 14 days to try DueDuo. If it isn't right for you, reply within 14 days and we'll refund you in full.",
      },
      { small: "DueDuo is a planning tool, not medical advice. Your doctor or midwife knows your pregnancy best." },
    ],
  },
  co_pilot: {
    subject: "Two people, one list",
    preview: "Your partner's tasks are already waiting for them.",
    blocks: [
      {
        p: "The pregnancy to-do list is long: appointments, leave, the budget, the car seat, telling family. It goes faster with two of you.",
      },
      { p: "When you invite your partner as your Co-Pilot, they get:" },
      {
        ul: [
          "their own tasks for each stage, so you don't have to hand them out",
          "the same roadmap you see, so nobody has to ask \"what's next?\"",
          "free access, with no extra payment",
        ],
      },
      { button: "Invite my partner", href: url("/co-pilot") },
      { p: "It takes a minute. You send them a link, and they join from their phone." },
    ],
  },
  day2_setup: {
    subject: "Your plan is one date away",
    preview: "Add your due date and DueDuo lays out every week for you both.",
    blocks: [
      { p: "Your DueDuo plan is ready to go. It just needs one thing from you: your due date." },
      {
        p: "Once it's in, DueDuo lays out what to do each week and splits it between you and your partner. Setup is four short steps.",
      },
      { button: "Finish setup", href: url("/onboarding") },
      {
        p: "Don't have an exact date yet? Use the one from your doctor or midwife, or your best guess for now. You can change it anytime in Settings.",
      },
      { p: "Stuck on anything? Just reply to this email. We read every reply." },
    ],
  },
  day2_task: (v) => ({
    subject: "Your first small win this week",
    preview: "One easy task to get you started.",
    blocks: [
      { p: "Your plan is set up, and this week's list is waiting on your Today page." },
      { p: v.taskTitle ? `Here's an easy one to start with: "${v.taskTitle}"` : "Pick the easiest one to start with." },
      {
        p: v.joinedPartnerName
          ? `Tick it off and ${v.joinedPartnerName} sees it's done too, so you don't have to remember to mention it.`
          : "Tick it off and that's one less thing to carry around in your head.",
      },
      { button: "See this week", href: url("/roadmap") },
      { p: "Stuck on anything? Just reply to this email. We read every reply." },
    ],
  }),
  appointment: {
    subject: "Before your next appointment",
    preview: "One page that saves the \"I forgot to ask\" moment.",
    blocks: [
      { p: "Appointments go fast, and the questions you meant to ask come back on the drive home." },
      { p: "DueDuo keeps them in one place for both of you:" },
      {
        ul: [
          "one shared list of questions you can add to all month",
          "quick notes on how you've been feeling, with dates",
          "a one-page printout to bring to the appointment",
        ],
      },
      { button: "Prepare my next appointment", href: url("/appointments/print") },
      {
        p: "Your doctor or midwife knows your pregnancy best. The printout just helps you make the most of your time with them.",
      },
    ],
  },
  budget: {
    subject: "The number to know before you shop",
    preview: "Your leave income gap, worked out in a few minutes.",
    blocks: [
      {
        p: "Most baby budgets start with a shopping list. A better place to start is your leave income gap: the months when less money comes in while one or both of you is on leave.",
      },
      {
        p: "DueDuo's budget works it out from your own numbers. It also keeps a Skip list of things many couples find they don't need, so the baby aisle doesn't decide for you.",
      },
      { button: "Open my budget", href: url("/budget") },
      {
        p: "One more thing worth a look: the ready-to-send messages for family, like a kind way to ask visitors to wait a few days after the birth.",
      },
    ],
  },
  feedback: {
    subject: "How is DueDuo working for you two?",
    preview: "Two quick questions, and a small favour.",
    blocks: [
      { p: "You've had DueDuo for 10 days, and we'd love to know how it's going. Just hit reply and tell us:" },
      { ol: ["What has helped most so far?", "What's missing or confusing?"] },
      { p: "We read every reply, and it decides what we build next." },
      {
        p: "And a small favour: if DueDuo has helped, may we share a sentence or two of your reply on our website or Instagram? We'll only do it if you say yes in your reply. You can choose your first name only, or no name at all.",
      },
      { p: "Thank you for planning with us." },
    ],
  },
};

/** "Anna Müller" → "Anna"; empty → "there". */
export function firstNameOf(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/)[0] || "there";
}

// ---------------------------------------------------------------------------
// Unsubscribe links: HMAC of the user id, keyed with CRON_SECRET.

function unsubscribeSignature(userId: string): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not set");
  return createHmac("sha256", secret).update(`unsubscribe:${userId}`).digest("base64url");
}

export function unsubscribeUrl(userId: string): string {
  return `${SITE.url}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeSignature(userId)}`;
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!process.env.CRON_SECRET) return false;
  const given = Buffer.from(token);
  const expected = Buffer.from(unsubscribeSignature(userId));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// ---------------------------------------------------------------------------
// Rendering

const C = {
  cream: "#FBF6F1",
  card: "#FFFFFF",
  ink: "#2E2523",
  muted: "#7A6B66",
  rose: "#9A4741",
  line: "#EADFD6",
};
const SERIF = "Fraunces, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function blockHtml(b: Block): string {
  const pStyle = `margin:0 0 16px;font:16px/1.6 ${SANS};color:${C.ink};`;
  if ("p" in b) return `<p style="${pStyle}">${esc(b.p)}</p>`;
  if ("small" in b) return `<p style="margin:0 0 16px;font:13px/1.5 ${SANS};color:${C.muted};">${esc(b.small)}</p>`;
  if ("ol" in b || "ul" in b) {
    const tag = "ol" in b ? "ol" : "ul";
    const items = "ol" in b ? b.ol : b.ul;
    const lis = items.map((i) => `<li style="margin:0 0 8px;">${esc(i)}</li>`).join("");
    return `<${tag} style="margin:0 0 20px;padding-left:22px;font:16px/1.6 ${SANS};color:${C.ink};">${lis}</${tag}>`;
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
<td style="border-radius:999px;background:${C.rose};">
<a href="${esc(b.href)}" style="display:inline-block;padding:13px 26px;font:600 16px/1 ${SANS};color:#FFFFFF;text-decoration:none;border-radius:999px;">${esc(b.button)}</a>
</td></tr></table>`;
}

function blockText(b: Block): string {
  if ("p" in b) return b.p;
  if ("small" in b) return b.small;
  if ("ol" in b) return b.ol.map((i, n) => `${n + 1}. ${i}`).join("\n");
  if ("ul" in b) return b.ul.map((i) => `- ${i}`).join("\n");
  return `${b.button}: ${b.href}`;
}

export type RenderedEmail = Omit<OutgoingEmail, "to">;

/** Renders one email. `userId` adds the unsubscribe link (every email except the welcome one). */
export function renderOnboardingEmail(
  key: EmailKey,
  opts: { firstName: string; userId?: string; vars?: TemplateVars },
): RenderedEmail {
  const entry = TEMPLATES[key];
  const t = typeof entry === "function" ? entry(opts.vars ?? {}) : entry;
  const unsub = key !== "welcome" && opts.userId ? unsubscribeUrl(opts.userId) : null;
  return renderEmail(t, {
    greeting: `Hi ${opts.firstName},`,
    reason: "You're getting this because you bought DueDuo.",
    unsubUrl: unsub,
    unsubLabel: "Unsubscribe from these tips",
  });
}

/** Shared DueDuo email layout (HTML + text + unsubscribe headers). */
export function renderEmail(
  t: Template,
  opts: { greeting: string; reason: string; unsubUrl: string | null; unsubLabel: string },
): RenderedEmail {
  const { greeting, reason } = opts;
  const unsub = opts.unsubUrl;
  const address = `${SITE.legal.operator}, ${SITE.legal.address}`;

  const footerHtml = [
    unsub
      ? `${esc(reason)} <a href="${esc(unsub)}" style="color:${C.muted};text-decoration:underline;">${esc(opts.unsubLabel)}</a>.`
      : esc(reason),
    esc(address),
  ].join("<br>");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(t.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(t.preview)}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 4px 20px;font:500 24px/1 ${SERIF};color:${C.rose};">DueDuo</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:32px 28px;">
<h1 style="margin:0 0 20px;font:500 26px/1.25 ${SERIF};color:${C.ink};">${esc(t.subject)}</h1>
<p style="margin:0 0 16px;font:16px/1.6 ${SANS};color:${C.ink};">${esc(greeting)}</p>
${t.blocks.map(blockHtml).join("\n")}
<p style="margin:8px 0 0;font:16px/1.6 ${SANS};color:${C.ink};">The DueDuo team</p>
</td></tr>
<tr><td style="padding:20px 4px 0;font:12px/1.6 ${SANS};color:${C.muted};">${footerHtml}</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    greeting,
    ...t.blocks.map(blockText),
    "The DueDuo team",
    "---",
    reason,
    ...(unsub ? [`${opts.unsubLabel}: ${unsub}`] : []),
    address,
  ].join("\n\n");

  const headers: Record<string, string> = unsub
    ? { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
    : {};

  return { subject: t.subject, html, text, headers };
}
