// Comment trigger words and the fixed texts the engine may send without asking.
// Every text here is approved by the owner before it goes live; the engine never writes its own words.
// Rules: a DM is at most 1000 bytes, no em dashes, US English with the UK word in brackets.

export type Trigger = {
  /** The word people comment, matched as a whole word, any case: "pack", "PACK!" and "#Pack" match, "backpack" doesn't. */
  word: string;
  /** Off until the hero post is live. */
  active: boolean;
  /** Only fire on these posts. Empty means any post from the last 7 days. */
  mediaIds?: string[];
  /** The private reply. One per comment; it is the only message allowed until the person writes back. */
  dm: string;
  /** Public replies under the comment, rotated so Instagram doesn't see the same text over and over. "{username}" is replaced. */
  publicReplies: string[];
};

const link = (path: string, content: string) =>
  `https://dueduo.com${path}?utm_source=instagram&utm_campaign=dm&utm_content=${content}`;

const REPLIES = [
  "Sent! Check your DMs, or your message requests if you don't follow us yet.",
  "Just sent it to your inbox. Not there? Look in message requests.",
  "On its way to your DMs. It may sit in message requests if we're not connected yet.",
  "Sent. If you can't see it, check message requests.",
];

export const TRIGGERS: Trigger[] = [
  {
    word: "PACK",
    active: false,
    dm:
      "Here's the hospital bag checklist for two. The birthing parent packs their own bag, the partner packs theirs and the baby's, then you swap and check. It prints on one page:\n\n" +
      link("/guides/hospital-bag-checklist", "pack") +
      "\n\nAim to have the bags ready by week 36.",
    publicReplies: REPLIES,
  },
  {
    word: "SPLIT",
    active: false,
    dm:
      "Here's the partner's pregnancy checklist, week by week. It's the jobs the partner can own, plus the few you do together, so nobody has to carry the whole list in their head:\n\n" +
      link("/guides/partner-pregnancy-checklist", "split"),
    publicReplies: REPLIES,
  },
  {
    word: "TELL",
    active: false,
    dm:
      "Here are the messages for telling family and work. Pick your due month, copy a message and send it on WhatsApp in a tap. Nothing you type is saved:\n\n" +
      link("/guides/how-to-tell-family-and-work", "tell"),
    publicReplies: REPLIES,
  },
  {
    word: "DATE",
    active: false,
    dm:
      "Here's your free plan for two. Put in your due date and you'll see the next 4 weeks split three ways: you, your partner, and together:\n\n" +
      link("/plan", "date"),
    publicReplies: REPLIES,
  },
];

const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toUpperCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

export function matchTrigger(text: string | undefined, mediaId: string, triggers: Trigger[] = TRIGGERS): Trigger | undefined {
  if (!text) return undefined;
  const words = new Set(normalize(text));
  return triggers.find(
    (t) => t.active && words.has(t.word.toUpperCase()) && (!t.mediaIds?.length || t.mediaIds.includes(mediaId)),
  );
}

export function pickPublicReply(t: Trigger, commentId: string, username?: string): string {
  // Stable choice per comment, so a retry never posts a different text.
  let h = 0;
  for (const ch of commentId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const text = t.publicReplies[h % t.publicReplies.length] ?? "Sent! Check your DMs.";
  return text.replace("{username}", username ? `@${username}` : "");
}

export function validateTriggers(triggers: Trigger[] = TRIGGERS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const t of triggers) {
    if (!/^[\p{L}\p{N}]+$/u.test(t.word)) problems.push(`${t.word}: one word, letters and digits only`);
    if (seen.has(t.word.toUpperCase())) problems.push(`${t.word}: used twice`);
    seen.add(t.word.toUpperCase());
    if (new TextEncoder().encode(t.dm).length > 1000) problems.push(`${t.word}: DM is over 1000 bytes`);
    for (const s of [t.dm, ...t.publicReplies]) if (s.includes("—")) problems.push(`${t.word}: has an em dash`);
    if (!t.publicReplies.length) problems.push(`${t.word}: needs at least one public reply`);
  }
  return problems;
}
