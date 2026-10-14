import type { MetadataRoute } from "next";
import { GUIDE_LIST } from "@/lib/guides";
import { SITE } from "@/lib/site-config";

/** Public marketing, guide and legal pages only. Logged-in app routes, checkout, auth and onboarding stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/guides`, changeFrequency: "monthly", priority: 0.7 },
    ...GUIDE_LIST.map((g) => ({
      url: `${SITE.url}${g.path}`,
      lastModified: g.published,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE.url}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/refund`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
