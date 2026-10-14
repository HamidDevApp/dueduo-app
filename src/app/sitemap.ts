import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

/** Public marketing and legal pages only. Logged-in app routes, checkout, auth and onboarding stay out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/refund`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
