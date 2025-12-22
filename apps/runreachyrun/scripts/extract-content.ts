#!/usr/bin/env npx tsx
/**
 * Extract content from all data sources for embedding generation.
 * Outputs: scripts/content.json
 */

import * as fs from "fs";
import * as path from "path";

interface ContentItem {
  id: string;
  type: "journal" | "blog" | "timeline" | "app" | "claude-session";
  title: string;
  content: string;
  metadata: {
    date?: string;
    tags?: string[];
    slug?: string;
    url?: string;
  };
}

// Import data directly (requires ts-node or tsx)
async function main() {
  const contentDir = path.join(__dirname, "../src/content");
  const documents: ContentItem[] = [];

  // 1. Journal entries
  console.log("Extracting journal entries...");
  const journalModule = await import("../src/content/journal/data");
  for (const entry of journalModule.journalEntries) {
    documents.push({
      id: `journal-${entry.slug}`,
      type: "journal",
      title: entry.title,
      content: truncateContent(entry.content, 2000),
      metadata: {
        date: entry.date,
        tags: entry.tags,
        slug: entry.slug,
        url: `/journal/${entry.slug}`,
      },
    });
  }
  console.log(`  Found ${journalModule.journalEntries.length} journal entries`);

  // 2. Blog posts
  console.log("Extracting blog posts...");
  const blogModule = await import("../src/content/blog/data");
  for (const post of blogModule.blogPosts) {
    documents.push({
      id: `blog-${post.slug}`,
      type: "blog",
      title: post.title,
      content: truncateContent(post.content, 2000),
      metadata: {
        date: post.date,
        tags: post.tags,
        slug: post.slug,
        url: `/blog/${post.slug}`,
      },
    });
  }
  console.log(`  Found ${blogModule.blogPosts.length} blog posts`);

  // 3. Timeline nodes
  console.log("Extracting timeline nodes...");
  const timelineModule = await import("../src/content/timeline/data");
  for (const node of timelineModule.timelineData) {
    const contentParts = [node.summary];
    if (node.content?.journal) contentParts.push(node.content.journal);
    if (node.content?.claudeSnippet) {
      contentParts.push(`Q: ${node.content.claudeSnippet.prompt}`);
      contentParts.push(`A: ${node.content.claudeSnippet.response}`);
    }

    documents.push({
      id: `timeline-${node.id}`,
      type: "timeline",
      title: node.title,
      content: truncateContent(contentParts.join("\n\n"), 1500),
      metadata: {
        date: node.date,
        tags: node.tags,
        url: `/timeline#${node.id}`,
      },
    });
  }
  console.log(`  Found ${timelineModule.timelineData.length} timeline nodes`);

  // 4. App pages
  console.log("Extracting app pages...");
  const appsModule = await import("../src/content/apps/data");
  for (const app of appsModule.appsData) {
    const featureList = app.features.map((f: { title: string }) => f.title).join(", ");
    const howItWorksList = app.howItWorks.map((h: { title: string }) => h.title).join(" → ");
    const contentParts = [
      app.description,
      `Features: ${featureList}`,
      `How it works: ${howItWorksList}`,
    ];
    if (app.techStack) {
      contentParts.push(`Tech stack: ${app.techStack.join(", ")}`);
    }

    documents.push({
      id: `app-${app.slug}`,
      type: "app",
      title: app.title,
      content: truncateContent(contentParts.join("\n\n"), 1500),
      metadata: {
        slug: app.slug,
        url: `/apps/${app.slug}`,
      },
    });
  }
  console.log(`  Found ${appsModule.appsData.length} app pages`);

  // 5. Claude sessions (from the Claude page data)
  console.log("Extracting Claude sessions...");
  // These are hardcoded in the Claude page, let's extract them
  const claudeSessions = [
    {
      id: "hardware-debugging",
      title: "Get physical Reachy Mini running from scratch",
      content:
        "45 minutes from 'help me get it running' to a talking robot. Debugged sim-vs-hardware daemon modes, serial port locking, and API key storage in real-time. Claude diagnosed the sim-vs-hardware daemon issue, fixed serial port locking with pkill, tested antenna movement, and traced API key validation through source code.",
      date: "2025-12-20",
    },
    {
      id: "huggingface-ecosystem",
      title: "Publish Focus Guardian to HuggingFace Spaces",
      content:
        "Discovered the Pollen Robotics ecosystem expects dashboard plugins, not standalone apps. Refactored to ReachyMiniApp pattern and learned Spaces serve as distribution points. Apps receive pre-initialized robots and respect stop_event.",
      date: "2025-12-21",
    },
    {
      id: "dj-reactor-audio",
      title: "Build real-time audio-reactive robot movements",
      content:
        "Created DJ Reactor with 7 genre presets. Claude designed the audio pipeline architecture with FFT analysis, beat detection, and movement mapping running in parallel threads. Real-time beat detection with ~50ms latency.",
      date: "2025-12-20",
    },
    {
      id: "design-system",
      title: "Create unique visual identity for runreachyrun.com",
      content:
        "Developed the signal-inspired design system with dark theme, cyan/amber accents, and animated components. The 'transmission active' motif emerged from discussing what makes robot communication feel distinct.",
      date: "2025-12-21",
    },
    {
      id: "timeline-architecture",
      title: "Build interactive timeline as site centerpiece",
      content:
        "Created expandable timeline nodes with filtering by type and tag, media grids, commit links, and Claude snippet display. Bidirectional linking to journal entries. Progressive disclosure prevents overwhelming users.",
      date: "2025-12-21",
    },
    {
      id: "github-integration",
      title: "Show live GitHub activity with graceful fallbacks",
      content:
        "Built API route with caching, rate limit awareness, and fallback data. Dashboard shows recent commits and repo stats, updating every 5 minutes. Always design for failure - fallback data means site never shows broken state.",
      date: "2025-12-21",
    },
    {
      id: "this-page",
      title: "Create dedicated page documenting Claude Code's role",
      content:
        "The recursive nature of AI-assisted development - Claude building the page that documents Claude building the project. Meta documentation capturing prompts and learnings for future sessions.",
      date: "2025-12-21",
    },
  ];

  for (const session of claudeSessions) {
    documents.push({
      id: `claude-${session.id}`,
      type: "claude-session",
      title: session.title,
      content: session.content,
      metadata: {
        date: session.date,
        url: `/claude#${session.id}`,
      },
    });
  }
  console.log(`  Found ${claudeSessions.length} Claude sessions`);

  // Write output
  const outputPath = path.join(__dirname, "content.json");
  const output = {
    documents,
    extractedAt: new Date().toISOString(),
    count: documents.length,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✓ Extracted ${documents.length} documents to ${outputPath}`);
}

function truncateContent(content: string, maxLength: number): string {
  // Clean up content
  const cleaned = content
    .replace(/```[\s\S]*?```/g, "[code block]") // Replace code blocks
    .replace(/\n{3,}/g, "\n\n") // Normalize newlines
    .trim();

  if (cleaned.length <= maxLength) return cleaned;

  // Truncate at word boundary
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.slice(0, lastSpace) + "...";
}

main().catch(console.error);
