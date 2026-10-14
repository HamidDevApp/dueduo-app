import { guideOgImage, OG_SIZE } from "@/components/guides/og-card";
import { GUIDES } from "@/lib/guides";

export const alt = GUIDES.leaveCalculator.h1;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage(GUIDES.leaveCalculator.h1, "Your leave income gap, for both parents · Free, no sign-up");
}
