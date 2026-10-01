export const BAGS = ["mom", "baby", "partner"] as const;
export type Bag = (typeof BAGS)[number];

export type BagItem = {
  id: string;
  bag: Bag;
  label: string;
  is_packed: boolean;
  sort_order: number;
};

/** Mirrors the list seeded by the signup trigger in 0001_init.sql. */
export const DEFAULT_BAG: Record<Bag, string[]> = {
  mom: [
    "Photo ID, insurance card & hospital papers",
    "Birth plan (2 copies)",
    "Phone + long charging cable",
    "Comfortable robe & slippers",
    "Nursing bras & breast pads",
    "Maternity pads & high-waist underwear",
    "Toiletries, lip balm, hair ties",
    "Loose going-home outfit",
  ],
  baby: [
    "Installed car seat",
    "2–3 bodysuits & sleepsuits",
    "Hat, socks & mittens",
    "Swaddle / receiving blanket",
    "Newborn diapers & wipes",
    "Going-home outfit",
  ],
  partner: ["Snacks & water bottle", "Change of clothes", "Phone charger / power bank", "Pillow & blanket"],
};

export const PACK_BY_WEEK = 36;
