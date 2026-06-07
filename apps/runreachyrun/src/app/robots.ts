import type { MetadataRoute } from "next";

const BASE = "https://www.runreachyrun.com";

// Allow every crawler, including AI agents — the build journal is meant to be found and cited.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
