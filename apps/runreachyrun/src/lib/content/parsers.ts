/**
 * Parsers for devlog content formats.
 * These parse the existing markdown structures without requiring frontmatter changes.
 */

import matter from "gray-matter";
import {
  ParsedMilestone,
  ParsedJournalEntry,
  ParsedStreamEntry,
  ParsedSession,
  ParsedBlogPost,
  ParsedIdea,
  ContentSource,
  DevlogFrontmatter,
} from "./types";

/**
 * Parse a milestones file (devlog/milestones/YYYY-MM.md)
 * Format: Multiple entries separated by --- with ## Date: Title headers
 */
export function parseMilestonesFile(
  content: string,
  source: ContentSource
): ParsedMilestone[] {
  const { data: frontmatter, content: body } = matter(content);
  const milestones: ParsedMilestone[] = [];

  // Split by horizontal rules (---)
  const entries = body.split(/\n---\n/).filter((e) => e.trim());

  for (const entry of entries) {
    const milestone = parseMilestoneEntry(entry, source, frontmatter);
    if (milestone) {
      milestones.push(milestone);
    }
  }

  return milestones;
}

function parseMilestoneEntry(
  entry: string,
  source: ContentSource,
  fileFrontmatter: DevlogFrontmatter
): ParsedMilestone | null {
  // Match header: ## Dec 20: Title or ## 2025-12-20: Title
  const headerMatch = entry.match(
    /^##\s+(?:(\d{4}-\d{2}-\d{2})|([A-Za-z]+\s+\d{1,2})):\s*(.+)$/m
  );
  if (!headerMatch) return null;

  const dateStr = headerMatch[1] || headerMatch[2];
  const title = headerMatch[3].trim();

  // Parse date - handle "Dec 20" format
  let date: string;
  if (headerMatch[1]) {
    date = headerMatch[1];
  } else {
    // Parse "Dec 20" style dates
    const monthMatch = dateStr.match(/([A-Za-z]+)\s+(\d{1,2})/);
    if (monthMatch) {
      const monthNames: Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12",
      };
      const month = monthNames[monthMatch[1]] || "01";
      const day = monthMatch[2].padStart(2, "0");
      // Get year from source path or default to current
      const yearMatch = source.path.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      date = `${year}-${month}-${day}`;
    } else {
      date = new Date().toISOString().split("T")[0];
    }
  }

  // Extract sections
  const whatHappenedMatch = entry.match(
    /\*\*What happened:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i
  );
  const whyItMattersMatch = entry.match(
    /\*\*Why it matters:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i
  );
  const theMomentMatch = entry.match(
    /\*\*The moment:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i
  );

  // Extract technical notes (bullet points after **Technical notes:**)
  const technicalMatch = entry.match(
    /\*\*Technical (?:notes|achievement|changes):\*\*\s*([\s\S]*?)(?=\n\*\*|\n---|\n##|$)/i
  );
  const technicalNotes: string[] = [];
  if (technicalMatch) {
    const lines = technicalMatch[1].split("\n");
    for (const line of lines) {
      const bulletMatch = line.match(/^[-*]\s+(.+)/);
      if (bulletMatch) {
        technicalNotes.push(bulletMatch[1].trim());
      }
    }
  }

  // Extract links
  const links: Record<string, string> = {};
  const linkMatches = entry.matchAll(
    /\*\*(?:Files|Journal|Space|Documentation|Links):\*\*\s*([^\n]+)/gi
  );
  for (const match of linkMatches) {
    const linkLine = match[1].trim();
    // Handle markdown links
    const mdLinkMatch = linkLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (mdLinkMatch) {
      links[mdLinkMatch[1]] = mdLinkMatch[2];
    } else if (linkLine.startsWith("http")) {
      links["url"] = linkLine;
    } else {
      links["reference"] = linkLine;
    }
  }

  return {
    date,
    title,
    whatHappened: whatHappenedMatch ? whatHappenedMatch[1].trim() : "",
    whyItMatters: whyItMattersMatch ? whyItMattersMatch[1].trim() : undefined,
    theMoment: theMomentMatch ? theMomentMatch[1].trim() : undefined,
    technicalNotes: technicalNotes.length > 0 ? technicalNotes : undefined,
    links: Object.keys(links).length > 0 ? links : undefined,
    rawContent: entry.trim(),
    source,
  };
}

/**
 * Parse a journal file (devlog/journal/YYYY-Www.md)
 * Format: Multiple day entries with ## YYYY-MM-DD: Title headers
 */
export function parseJournalFile(
  content: string,
  source: ContentSource
): ParsedJournalEntry[] {
  const { data: frontmatter, content: body } = matter(content);
  const entries: ParsedJournalEntry[] = [];

  // Split by date headers
  const entryMatches = body.split(/(?=^## \d{4}-\d{2}-\d{2}:)/m);

  for (const entry of entryMatches) {
    if (!entry.trim()) continue;
    const parsed = parseJournalEntry(entry, source, frontmatter);
    if (parsed) {
      entries.push(parsed);
    }
  }

  return entries;
}

function parseJournalEntry(
  entry: string,
  source: ContentSource,
  fileFrontmatter: DevlogFrontmatter
): ParsedJournalEntry | null {
  // Match header: ## 2025-12-20: Title or ## YYYY-MM-DD: Title
  const headerMatch = entry.match(
    /^##\s+(\d{4}-\d{2}-\d{2}):\s*(.+)$/m
  );
  if (!headerMatch) return null;

  const date = headerMatch[1];
  const title = headerMatch[2].trim();

  // Extract duration and goal from first lines
  const durationMatch = entry.match(/\*\*Duration:\*\*\s*(.+)/i);
  const goalMatch = entry.match(/\*\*Goal:\*\*\s*(.+)/i);

  // Parse sections (### headers)
  const sections: { heading: string; content: string }[] = [];
  const sectionMatches = entry.matchAll(/^###\s+(.+)$([\s\S]*?)(?=^###|\n---\n|$)/gm);
  for (const match of sectionMatches) {
    sections.push({
      heading: match[1].trim(),
      content: match[2].trim(),
    });
  }

  return {
    date,
    title,
    duration: durationMatch ? durationMatch[1].trim() : undefined,
    goal: goalMatch ? goalMatch[1].trim() : undefined,
    sections,
    rawContent: entry.trim(),
    source,
  };
}

/**
 * Parse a stream file (devlog/stream/YYYY-Www.md)
 * Format: Timestamped entries like **HH:MM** - content
 */
export function parseStreamFile(
  content: string,
  source: ContentSource
): ParsedStreamEntry[] {
  const { content: body } = matter(content);
  const entries: ParsedStreamEntry[] = [];

  // Extract current date from day headers
  let currentDate = "";
  const dateHeaderMatch = body.match(/^##\s+\w+,\s+(\w+)\s+(\d+)/m);
  if (dateHeaderMatch) {
    // Get year from source path
    const yearMatch = source.path.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
    const monthNames: Record<string, string> = {
      Jan: "01", January: "01", Feb: "02", February: "02",
      Mar: "03", March: "03", Apr: "04", April: "04",
      May: "05", Jun: "06", June: "06", Jul: "07", July: "07",
      Aug: "08", August: "08", Sep: "09", September: "09",
      Oct: "10", October: "10", Nov: "11", November: "11",
      Dec: "12", December: "12",
    };
    const month = monthNames[dateHeaderMatch[1]] || "01";
    const day = dateHeaderMatch[2].padStart(2, "0");
    currentDate = `${year}-${month}-${day}`;
  }

  // Match timestamped entries
  const lines = body.split("\n");
  for (const line of lines) {
    // Update current date if we hit a day header
    const dayMatch = line.match(/^##\s+\w+,\s+(\w+)\s+(\d+)/);
    if (dayMatch) {
      const yearMatch = source.path.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      const monthNames: Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12",
      };
      const month = monthNames[dayMatch[1]] || "01";
      const day = dayMatch[2].padStart(2, "0");
      currentDate = `${year}-${month}-${day}`;
      continue;
    }

    // Match **HH:MM** or **YYYY-MM-DD HH:MM** patterns
    const timeMatch = line.match(
      /^\*\*(?:(\d{4}-\d{2}-\d{2})\s+)?(\d{1,2}:\d{2})\*\*\s*[-–]\s*(.+)/
    );
    if (timeMatch) {
      const date = timeMatch[1] || currentDate;
      const time = timeMatch[2];
      const entryContent = timeMatch[3].trim();

      if (date && entryContent) {
        entries.push({
          date,
          time,
          content: entryContent,
          source,
        });
      }
    }
  }

  return entries;
}

/**
 * Parse a session file (sessions/YYYY-MM-DD-*.md)
 * Format: Structured markdown with sections
 */
export function parseSessionFile(
  content: string,
  source: ContentSource
): ParsedSession | null {
  const { data: frontmatter, content: body } = matter(content);

  // Extract date from filename or content
  const filenameMatch = source.path.match(/(\d{4}-\d{2}-\d{2})/);
  const date = filenameMatch
    ? filenameMatch[1]
    : new Date().toISOString().split("T")[0];

  // Extract title from # header
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace(/^Session:\s*/i, "").trim() : "Untitled Session";

  // Extract metadata
  const durationMatch = body.match(/\*\*Duration:\*\*\s*(.+)/i);
  const statusMatch = body.match(/\*\*Status:\*\*\s*(.+)/i);

  // Extract summary (## Summary section)
  const summaryMatch = body.match(/##\s+Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  // Extract accomplishments (## Accomplishments section with bullet points)
  const accomplishmentsMatch = body.match(
    /##\s+Accomplishments\s*\n([\s\S]*?)(?=\n##|$)/i
  );
  const accomplishments: string[] = [];
  if (accomplishmentsMatch) {
    const lines = accomplishmentsMatch[1].split("\n");
    for (const line of lines) {
      const bulletMatch = line.match(/^[-*]\s+(.+)/);
      if (bulletMatch) {
        accomplishments.push(bulletMatch[1].trim());
      }
    }
  }

  // Extract blockers
  const blockersMatch = body.match(
    /##\s+Blockers?\s*(?:\(if any\))?\s*\n([\s\S]*?)(?=\n##|$)/i
  );

  // Extract next session
  const nextMatch = body.match(
    /##\s+Next Session\s*\n([\s\S]*?)(?=\n##|$)/i
  );

  // Extract technical notes
  const techMatch = body.match(
    /##\s+Technical Notes\s*\n([\s\S]*?)(?=\n##|$)/i
  );

  return {
    date,
    title,
    duration: durationMatch ? durationMatch[1].trim() : undefined,
    status: statusMatch ? statusMatch[1].trim() : "unknown",
    summary,
    accomplishments,
    blockers: blockersMatch ? blockersMatch[1].trim() : undefined,
    nextSession: nextMatch ? nextMatch[1].trim() : undefined,
    technicalNotes: techMatch ? techMatch[1].trim() : undefined,
    rawContent: body.trim(),
    source,
  };
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string, date?: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  if (date) {
    return `${date}-${baseSlug}`;
  }
  return baseSlug;
}

/**
 * Estimate reading time from content
 */
export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Parse a blog file (devlog/blog/YYYY-MM.md)
 * Format: ### Title entries with **Status:** fields
 */
export function parseBlogFile(
  content: string,
  source: ContentSource
): ParsedBlogPost[] {
  const { content: body } = matter(content);
  const posts: ParsedBlogPost[] = [];

  // Split by ### headers (individual blog post entries)
  const entries = body.split(/(?=^### )/m).filter((e) => e.trim());

  for (const entry of entries) {
    const post = parseBlogEntry(entry, source);
    if (post) {
      posts.push(post);
    }
  }

  return posts;
}

function parseBlogEntry(
  entry: string,
  source: ContentSource
): ParsedBlogPost | null {
  // Match header: ### Title
  const headerMatch = entry.match(/^###\s+(.+)$/m);
  if (!headerMatch) return null;

  const title = headerMatch[1].trim();

  // Skip if title is empty or looks like a section header
  if (!title || title.toLowerCase().includes("section")) {
    return null;
  }

  // Extract fields
  const statusMatch = entry.match(/\*\*Status:\*\*\s*(.+)/i);
  const hookMatch = entry.match(/\*\*Hook:\*\*\s*(.+)/i);
  const angleMatch = entry.match(/\*\*Angle:\*\*\s*(.+)/i);
  const targetMatch = entry.match(/\*\*Target:\*\*\s*(.+)/i);
  const themeMatch = entry.match(/\*\*Theme:\*\*\s*(.+)/i);

  // Determine status from **Status:** field
  let status: ParsedBlogPost["status"] = "idea";
  if (statusMatch) {
    const statusText = statusMatch[1].toLowerCase();
    if (statusText.includes("draft")) status = "draft";
    else if (statusText.includes("ready")) status = "ready";
    else if (statusText.includes("published")) status = "published";
    else if (statusText.includes("idea")) status = "idea";
  }

  // Get content (everything after the metadata lines)
  const contentLines = entry.split("\n").filter((line) => {
    return !line.startsWith("###") &&
           !line.startsWith("**Status:") &&
           !line.startsWith("**Hook:") &&
           !line.startsWith("**Angle:") &&
           !line.startsWith("**Target:") &&
           !line.startsWith("**Theme:") &&
           !line.startsWith("**Key moments:");
  });

  // Extract key moments if present
  const keyMomentsMatch = entry.match(
    /\*\*Key moments:\*\*\s*([\s\S]*?)(?=\n\*\*|\n###|$)/i
  );
  const keyMoments: string[] = [];
  if (keyMomentsMatch) {
    // Key moments can be inline (comma-separated) or bullet points
    const keyMomentsText = keyMomentsMatch[1].trim();
    if (keyMomentsText.includes(",")) {
      // Comma-separated
      keyMoments.push(...keyMomentsText.split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      // Bullet points
      const lines = keyMomentsText.split("\n");
      for (const line of lines) {
        const bulletMatch = line.match(/^[-*]\s+(.+)/);
        if (bulletMatch) {
          keyMoments.push(bulletMatch[1].trim());
        }
      }
    }
  }

  return {
    title,
    status,
    hook: hookMatch ? hookMatch[1].trim().replace(/^["']|["']$/g, "") : undefined,
    angle: angleMatch ? angleMatch[1].trim() : undefined,
    target: targetMatch ? targetMatch[1].trim() : undefined,
    theme: themeMatch ? themeMatch[1].trim() : undefined,
    content: contentLines.join("\n").trim(),
    keyMoments: keyMoments.length > 0 ? keyMoments : undefined,
    rawContent: entry.trim(),
    source,
  };
}

/**
 * Parse an ideas file (devlog/ideas/YYYY-Www.md)
 * Format: Timestamped entries like **HH:MM** - [Category] Idea description
 */
export function parseIdeasFile(
  content: string,
  source: ContentSource
): ParsedIdea[] {
  const { content: body } = matter(content);
  const ideas: ParsedIdea[] = [];

  // Get date from source path
  const weekMatch = source.path.match(/(\d{4})-W(\d{2})/);
  let currentDate = "";
  if (weekMatch) {
    // Approximate date from week number
    const year = parseInt(weekMatch[1]);
    const week = parseInt(weekMatch[2]);
    const jan1 = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    const weekDate = new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    currentDate = weekDate.toISOString().split("T")[0];
  }

  const lines = body.split("\n");
  for (const line of lines) {
    // Update date from day headers
    const dayMatch = line.match(/^##\s+\w+,\s+(\w+)\s+(\d+)/);
    if (dayMatch) {
      const yearMatch = source.path.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
      const monthNames: Record<string, string> = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12",
      };
      const month = monthNames[dayMatch[1]] || "01";
      const day = dayMatch[2].padStart(2, "0");
      currentDate = `${year}-${month}-${day}`;
      continue;
    }

    // Match idea entries: **HH:MM** - [Category] Description or **HH:MM** - Description
    const ideaMatch = line.match(
      /^\*\*(\d{1,2}:\d{2})\*\*\s*[-–]\s*(?:\[([^\]]+)\]\s*)?(.+)/
    );
    if (ideaMatch) {
      const time = ideaMatch[1];
      const category = ideaMatch[2];
      const description = ideaMatch[3].trim();

      // Try to extract title from description (first sentence or before colon)
      let title = description;
      let desc = description;
      const colonIndex = description.indexOf(":");
      if (colonIndex > 0 && colonIndex < 50) {
        title = description.slice(0, colonIndex).trim();
        desc = description.slice(colonIndex + 1).trim();
      } else {
        // Use first 50 chars or first sentence
        const sentenceEnd = description.search(/[.!?]/);
        if (sentenceEnd > 0 && sentenceEnd < 80) {
          title = description.slice(0, sentenceEnd + 1);
          desc = description;
        } else {
          title = description.slice(0, 50) + (description.length > 50 ? "..." : "");
        }
      }

      // Extract tags from description
      const tagMatches = description.matchAll(/#(\w+)/g);
      const tags = Array.from(tagMatches).map((m) => m[1]);

      ideas.push({
        date: currentDate,
        time,
        category,
        title,
        description: desc,
        tags: tags.length > 0 ? tags : undefined,
        source,
      });
    }
  }

  return ideas;
}
