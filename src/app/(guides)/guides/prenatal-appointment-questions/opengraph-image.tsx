import { guideOgImage, OG_SIZE } from "@/components/guides/og-card";
import { GUIDES } from "@/lib/guides";

export const alt = GUIDES.questions.h1;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage(GUIDES.questions.h1, "15 questions by trimester · Free printable");
}
