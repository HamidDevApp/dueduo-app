import { guideOgImage, OG_SIZE } from "@/components/guides/og-card";
import { GUIDES } from "@/lib/guides";

export const alt = GUIDES.plan.h1;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage(GUIDES.plan.h1, "Your next 4 weeks, split between you · Free, no sign-up");
}
