import "server-only";
import { renderEmail, type RenderedEmail, type Template } from "@/lib/onboarding-emails";
import { SITE } from "@/lib/site-config";

/**
 * Emails for the free planning pack list (approved copy, 2026-10-20 — keep it verbatim).
 * confirm → delivery (on confirm) → day 2 → day 5 → day 9.
 */
export const PACK_PDF_PATH = "/downloads/dueduo-planning-pack.pdf";
export type PackEmailKey = "confirm" | "delivery" | "day2" | "day5" | "day9";

const url = (path: string) => `${SITE.url}${path}`;

function template(key: PackEmailKey, confirmUrl?: string): Template {
  switch (key) {
    case "confirm":
      return {
        subject: "Confirm your email to get the pack",
        preview: "One tap and your free planning pack is on its way.",
        blocks: [
          { p: "Tap below to confirm your email, and we'll send your free planning pack straight away." },
          { button: "Confirm my email", href: confirmUrl ?? url("/guides") },
          { p: "Didn't ask for this? Just ignore this email and you won't hear from us." },
        ],
      };
    case "delivery":
      return {
        subject: "Your free planning pack is here",
        preview: "Five printables for the two of you.",
        blocks: [
          { p: "Here's your planning pack: five printables to work through together." },
          { button: "Download the pack (PDF)", href: url(PACK_PDF_PATH) },
          {
            p: "A tip to start: print the who-owns-what sheet and fill it in together this week. It takes 20 minutes, and it's the fastest way to make sure one person isn't carrying everything.",
          },
        ],
      };
    case "day2":
      return {
        subject: "The 20-minute conversation that splits the load",
        preview: "Own whole jobs, not chores.",
        blocks: [
          {
            p: "The hardest part of pregnancy planning often isn't the tasks, it's noticing them. Here's how to split the list so you each own whole jobs, start to finish: notice, research, decide, finish.",
          },
          { button: "Read the guide", href: url("/guides/split-pregnancy-to-do-list?utm_source=email&utm_campaign=pack&utm_content=day2") },
        ],
      };
    case "day5":
      return SITE.foundingOpen
        ? {
            subject: "Want to plan it together in DueDuo, free?",
            preview: "We're looking for 10 founding couples.",
            blocks: [
              {
              p: "If you're expecting now and live in the US, Canada or Australia, we're looking for 10 founding couples to use DueDuo free, both of you, for this pregnancy: a week-by-week plan with your own task lists, shared checklists and printouts. In return, we ask for short, honest feedback after two weeks, by WhatsApp or email.",
              },
              { p: `If you'd like a spot, just reply "FOUNDING" and we'll send you a 2-minute consent form, then your code.` },
            ],
          }
        : {
            subject: "Want to plan it together in DueDuo?",
            preview: "One payment, for both of you.",
            blocks: [
              { p: "DueDuo is a week-by-week plan for both of you, with your own task lists, shared checklists and printouts." },
              {
                p: `${SITE.price} once, no subscription, your partner joins free${SITE.guaranteeDays ? `, ${SITE.guaranteeDays}-day money-back guarantee` : ""}.`,
              },
              { button: "See how DueDuo works", href: url("/?utm_source=email&utm_campaign=pack&utm_content=day5") },
            ],
          };
    case "day9":
      return {
        subject: "Your next few weeks, already planned",
        preview: "What to book, buy and decide, split between you.",
        blocks: [
          {
            p: `Every week, DueDuo shows you both what matters now: what to book, buy and decide, split between you, with printouts for appointments and messages ready to send. One payment of ${SITE.price}, no subscription, and your partner joins free.`,
          },
          { button: "See how DueDuo works", href: url("/?utm_source=email&utm_campaign=pack&utm_content=day9") },
        ],
      };
  }
}

export function renderPackEmail(key: PackEmailKey, opts: { unsubUrl: string | null; confirmUrl?: string }): RenderedEmail {
  return renderEmail(template(key, opts.confirmUrl), {
    greeting: "Hi there,",
    reason: "You're getting this because you asked for the DueDuo planning pack.",
    unsubUrl: opts.unsubUrl,
    unsubLabel: "Unsubscribe",
  });
}
