import { guideOgImage, OG_SIZE } from "@/components/guides/og-card";
import { GUIDES } from "@/lib/guides";

export const alt = GUIDES.bossNews.h1;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage(GUIDES.bossNews.h1, "Email and script templates, for both of you");
}
