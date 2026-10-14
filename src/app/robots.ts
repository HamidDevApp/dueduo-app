import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

/** Keep crawlers on the public pages; everything behind login, checkout and auth is private. */
const PRIVATE_ROUTES = [
  "/dashboard",
  "/roadmap",
  "/appointments",
  "/questions",
  "/budget",
  "/registry",
  "/hospital-bag",
  "/co-pilot",
  "/settings",
  "/onboarding",
  "/checkout",
  "/login",
  "/auth",
  "/invite",
  "/api",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_ROUTES },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
