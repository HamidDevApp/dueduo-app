/* =========================================================
   Smart Budget — labels, starter kit and the Skip list.
   General guidance; prices vary widely, so estimates start at 0.
   ========================================================= */

export const BUDGET_CATEGORIES = [
  "medical",
  "baby_gear",
  "nursery",
  "clothing",
  "feeding",
  "leave_income",
  "other",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const NEED_LEVELS = ["essential", "nice", "skip"] as const;
export type NeedLevel = (typeof NEED_LEVELS)[number];

export const SOURCES = ["buy_new", "second_hand", "borrow", "gift"] as const;
export type Source = (typeof SOURCES)[number];

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  medical: "Medical & recovery",
  baby_gear: "Baby gear",
  nursery: "Sleep & nursery",
  clothing: "Clothing",
  feeding: "Feeding",
  leave_income: "Leave & income",
  other: "Other",
};

export const NEED_LABELS: Record<NeedLevel, { title: string; hint: string }> = {
  essential: { title: "Essential", hint: "Needed in the first 3 months." },
  nice: { title: "Nice to have", hint: "Wait until after the baby shower or the first weeks." },
  skip: { title: "Skip", hint: "Not buying it — this is money you kept." },
};

export const SOURCE_LABELS: Record<Source, string> = {
  buy_new: "Buy new",
  second_hand: "Second-hand",
  borrow: "Borrow",
  gift: "Gift / registry",
};

export type BudgetItem = {
  id: string;
  label: string;
  category: BudgetCategory;
  need_level: NeedLevel;
  source: Source;
  estimated: number;
  actual: number;
  is_paid: boolean;
  buy_by_week: number | null;
};

/* ---------- Starter kit: one click to a realistic, lean list ---------- */

export type StarterItem = {
  label: string;
  category: BudgetCategory;
  need_level: Exclude<NeedLevel, "skip">;
  buy_by_week: number;
  source?: Source;
};

export const STARTER_KIT: StarterItem[] = [
  { label: "Infant car seat (buy new or with full history)", category: "baby_gear", need_level: "essential", buy_by_week: 34 },
  { label: "Crib or bassinet + firm, flat mattress", category: "nursery", need_level: "essential", buy_by_week: 34 },
  { label: "Fitted sheets (×3)", category: "nursery", need_level: "essential", buy_by_week: 34 },
  { label: "Sleep sacks or swaddles (×3)", category: "nursery", need_level: "essential", buy_by_week: 34 },
  { label: "Bodysuits & sleepsuits, 0–3 months", category: "clothing", need_level: "essential", buy_by_week: 32, source: "second_hand" },
  { label: "Diapers & wipes for the first month", category: "other", need_level: "essential", buy_by_week: 36 },
  { label: "Feeding basics (nursing supplies or bottles)", category: "feeding", need_level: "essential", buy_by_week: 34 },
  { label: "Stroller or baby carrier", category: "baby_gear", need_level: "essential", buy_by_week: 34, source: "second_hand" },
  { label: "Thermometer, nail clippers, saline drops", category: "medical", need_level: "essential", buy_by_week: 36 },
  { label: "Postpartum recovery supplies", category: "medical", need_level: "essential", buy_by_week: 35 },
  { label: "Baby monitor", category: "baby_gear", need_level: "nice", buy_by_week: 36 },
  { label: "Bouncer", category: "baby_gear", need_level: "nice", buy_by_week: 38, source: "borrow" },
  { label: "Changing pad (on an existing dresser)", category: "nursery", need_level: "nice", buy_by_week: 36 },
  { label: "Nursing pillow", category: "feeding", need_level: "nice", buy_by_week: 36 },
];

/* ---------- The Skip list ---------- */

export type SkipGuideItem = {
  item: string;
  reason: string;
  /** True when it's a safety issue, not just a money one. */
  unsafe?: boolean;
};

export const SKIP_GUIDE: SkipGuideItem[] = [
  { item: "Crib bumpers, pillows & loose blankets", reason: "Not just unnecessary — safe-sleep guidance says keep the crib bare.", unsafe: true },
  { item: "Sleep positioners & inclined sleepers", reason: "Linked to safety risks. Babies should sleep flat on their back.", unsafe: true },
  { item: "Wipe warmer", reason: "Babies don't need warm wipes. One less gadget to clean." },
  { item: "Baby shoes before walking", reason: "Socks do the job until your baby walks." },
  { item: "Special baby laundry detergent", reason: "Any fragrance-free, dye-free detergent works." },
  { item: "A dedicated changing table", reason: "A changing pad on a sturdy dresser does the same job." },
  { item: "Lots of newborn-size clothes", reason: "Many babies outgrow them in weeks. Buy a few, then 0–3 months." },
  { item: "Baby food maker", reason: "Solids start months from now, and a blender or fork works." },
  { item: "Designer diaper bag", reason: "Any backpack with pockets works — and your partner will carry it too." },
  { item: "Matching nursery furniture sets", reason: "Baby needs a safe sleep space. Everything else can wait." },
];

export const SECOND_HAND_TIPS = [
  "Great second-hand: clothes, bouncers, carriers, strollers, books and toys.",
  "Check any second-hand gear against official recall lists before using it.",
  "Avoid a second-hand car seat unless you know its full history (no crashes, not expired).",
];
