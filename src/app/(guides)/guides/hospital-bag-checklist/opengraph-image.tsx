import { guideOgImage, OG_SIZE } from "@/components/guides/og-card";
import { GUIDES } from "@/lib/guides";

export const alt = GUIDES.hospitalBag.h1;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage(GUIDES.hospitalBag.h1, "Free printable checklist");
}
