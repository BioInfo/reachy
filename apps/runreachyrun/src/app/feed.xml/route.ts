import { getAllBlogPosts, getAllJournalEntries } from "@/lib/content";

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const siteUrl = "https://runreachyrun.com";
  const blogPosts = await getAllBlogPosts();
  const journalEntries = await getAllJournalEntries();

  // Combine blog posts and journal entries for the feed
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
    guid: string;
    category: string;
  }> = [];

  // Add blog posts (only drafts and ready, not just ideas)
  for (const post of blogPosts) {
    if (post.status === "idea") continue;

    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    items.push({
      title: post.title,
      link: `${siteUrl}/blog#${slug}`,
      description: post.hook || post.angle || post.content.slice(0, 200),
      pubDate: new Date().toUTCString(), // Blog posts don't have dates yet
      guid: `blog-${slug}`,
      category: "Blog",
    });
  }

  // Add journal entries
  for (const entry of journalEntries) {
    items.push({
      title: entry.title,
      link: `${siteUrl}/journal/${entry.slug}`,
      description: entry.summary,
      pubDate: new Date(entry.date).toUTCString(),
      guid: `journal-${entry.slug}`,
      category: "Journal",
    });
  }

  // Sort by date descending
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>runreachyrun — Building a Reachy Mini Lite</title>
    <link>${siteUrl}</link>
    <description>Documenting the journey of building and programming a Reachy Mini Lite robot. Dev journal, build timeline, apps, and experiments.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/favicon.ico</url>
      <title>runreachyrun</title>
      <link>${siteUrl}</link>
    </image>
${items.map(item => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="false">${item.guid}</guid>
      <category>${item.category}</category>
    </item>`).join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
