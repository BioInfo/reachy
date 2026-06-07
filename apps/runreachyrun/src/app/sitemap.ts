import type { MetadataRoute } from "next";
import { getAllBlogPosts, getAllJournalEntries } from "@/lib/content";

const BASE = "https://www.runreachyrun.com";

const STATIC = [
  "",
  "/journal",
  "/blog",
  "/apps",
  "/timeline",
  "/getting-started",
  "/claude",
  "/about",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  // Dynamic content — resilient: a content-load hiccup must not fail the build.
  try {
    const [blog, journal] = await Promise.all([
      getAllBlogPosts(),
      getAllJournalEntries(),
    ]);
    for (const post of blog) {
      entries.push({ url: `${BASE}/blog/${post.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const entry of journal) {
      entries.push({ url: `${BASE}/journal/${entry.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
  } catch {
    // static routes still ship
  }

  return entries;
}
