/**
 * Content reader for runreachyrun.com
 *
 * Reads content from devlog files and transforms to site data types.
 * Falls back to static data when devlog files aren't available.
 */

import fs from "fs";
import path from "path";
import { TimelineNode, JournalEntry } from "@/types";
import {
  parseMilestonesFile,
  parseJournalFile,
  parseStreamFile,
  parseSessionFile,
  parseBlogFile,
  parseIdeasFile,
  generateSlug,
  estimateReadingTime,
} from "./parsers";
import {
  ContentSource,
  ParsedMilestone,
  ParsedJournalEntry,
  ParsedSession,
  ParsedBlogPost,
  ParsedIdea,
} from "./types";

// Paths relative to the site directory
const SITE_ROOT = process.cwd();
const DEVLOG_PATH = path.join(SITE_ROOT, "../../devlog");
const SESSIONS_PATH = path.join(SITE_ROOT, "../../sessions");

/**
 * Check if devlog directory exists
 */
export function devlogExists(): boolean {
  try {
    return fs.existsSync(DEVLOG_PATH);
  } catch {
    return false;
  }
}

/**
 * Read all files matching a pattern from a directory
 */
function readDirectoryFiles(dirPath: string, pattern: RegExp): { path: string; content: string }[] {
  try {
    if (!fs.existsSync(dirPath)) return [];

    const files = fs.readdirSync(dirPath);
    return files
      .filter((f) => pattern.test(f))
      .map((f) => {
        const fullPath = path.join(dirPath, f);
        return {
          path: fullPath,
          content: fs.readFileSync(fullPath, "utf-8"),
        };
      });
  } catch (error) {
    console.warn(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
}

// =============================================================================
// TIMELINE CONTENT
// =============================================================================

/**
 * Get timeline nodes from devlog milestones and sessions
 */
export async function getTimelineFromDevlog(): Promise<TimelineNode[]> {
  const nodes: TimelineNode[] = [];

  // Read milestones
  const milestonesDir = path.join(DEVLOG_PATH, "milestones");
  const milestoneFiles = readDirectoryFiles(milestonesDir, /\.md$/);

  for (const file of milestoneFiles) {
    const source: ContentSource = {
      path: file.path,
      type: "devlog",
    };

    const milestones = parseMilestonesFile(file.content, source);
    for (const m of milestones) {
      nodes.push(milestoneToTimelineNode(m));
    }
  }

  // Read sessions and convert to timeline nodes
  const sessionFiles = readDirectoryFiles(SESSIONS_PATH, /\.md$/);

  for (const file of sessionFiles) {
    const source: ContentSource = {
      path: file.path,
      type: "session",
    };

    const session = parseSessionFile(file.content, source);
    if (session) {
      nodes.push(sessionToTimelineNode(session));
    }
  }

  // Sort by date descending
  nodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return nodes;
}

function milestoneToTimelineNode(m: ParsedMilestone): TimelineNode {
  // Determine type from title/content
  let type: TimelineNode["type"] = "milestone";
  const lowerTitle = m.title.toLowerCase();
  if (lowerTitle.includes("first") || lowerTitle.includes("breakthrough")) {
    type = "breakthrough";
  } else if (lowerTitle.includes("fail") || lowerTitle.includes("block") || lowerTitle.includes("dead end")) {
    type = "failure";
  }

  // Extract tags from title and content
  const tags = extractTags(m.title + " " + m.whatHappened);

  return {
    id: generateSlug(m.title, m.date),
    date: m.date,
    title: m.title,
    type,
    summary: m.whatHappened,
    content: {
      journal: m.theMoment || m.whyItMatters,
      commits: m.links?.reference ? [m.links.reference] : undefined,
      claudeSnippet: m.whyItMatters
        ? {
            prompt: "What makes this significant?",
            response: m.whyItMatters,
            context: m.theMoment,
          }
        : undefined,
    },
    tags,
  };
}

function sessionToTimelineNode(s: ParsedSession): TimelineNode {
  // Determine type from status
  let type: TimelineNode["type"] = "session";
  const lowerStatus = s.status.toLowerCase();
  if (lowerStatus.includes("block")) {
    type = "failure";
  } else if (lowerStatus.includes("complete")) {
    type = "milestone";
  }

  const tags = extractTags(s.title + " " + s.summary);

  return {
    id: generateSlug(s.title, s.date),
    date: s.date,
    title: s.title,
    type,
    summary: s.summary || s.accomplishments.slice(0, 2).join(". "),
    content: {
      journal: s.accomplishments.join("\n- "),
    },
    tags,
  };
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  // Topic-based tags
  const topicPatterns: Record<string, RegExp> = {
    hardware: /hardware|robot|physical|servo|motor/,
    software: /software|code|api|sdk|app/,
    "claude-code": /claude|ai|llm/,
    camera: /camera|vision|video/,
    audio: /audio|music|sound|beat/,
    simulation: /simulation|mujoco|sim/,
    "focus-guardian": /focus.?guardian|productivity|body.?double/,
    "dj-reactor": /dj.?reactor|music|dance/,
    huggingface: /hugging.?face|hf|space/,
    infrastructure: /daemon|launch|config|setup/,
  };

  for (const [tag, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(lowerText)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // Limit to 5 tags
}

// =============================================================================
// JOURNAL CONTENT
// =============================================================================

/**
 * Get journal entries from devlog
 */
export async function getJournalFromDevlog(): Promise<JournalEntry[]> {
  const entries: JournalEntry[] = [];

  // Read journal files
  const journalDir = path.join(DEVLOG_PATH, "journal");
  const journalFiles = readDirectoryFiles(journalDir, /\.md$/);

  for (const file of journalFiles) {
    const source: ContentSource = {
      path: file.path,
      type: "devlog",
    };

    const parsed = parseJournalFile(file.content, source);
    for (const p of parsed) {
      entries.push(parsedJournalToEntry(p));
    }
  }

  // Also include sessions as journal entries
  const sessionFiles = readDirectoryFiles(SESSIONS_PATH, /\.md$/);

  for (const file of sessionFiles) {
    const source: ContentSource = {
      path: file.path,
      type: "session",
    };

    const session = parseSessionFile(file.content, source);
    if (session) {
      entries.push(sessionToJournalEntry(session));
    }
  }

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
}

function parsedJournalToEntry(p: ParsedJournalEntry): JournalEntry {
  // Combine sections into content
  const content = p.sections
    .map((s) => `## ${s.heading}\n\n${s.content}`)
    .join("\n\n");

  // Determine mood from content
  let mood: JournalEntry["mood"] = "neutral";
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes("worked") || lowerContent.includes("success") || lowerContent.includes("finally")) {
    mood = "win";
  } else if (lowerContent.includes("failed") || lowerContent.includes("frustrat") || lowerContent.includes("block")) {
    mood = "struggle";
  } else if (lowerContent.includes("idea") || lowerContent.includes("excit") || lowerContent.includes("can't wait")) {
    mood = "excited";
  }

  const tags = extractTags(p.title + " " + content);

  return {
    slug: generateSlug(p.title, p.date),
    title: p.title,
    date: p.date,
    summary: p.goal || p.sections[0]?.content.slice(0, 200) || "",
    content: content || p.rawContent,
    tags,
    mood,
    readingTime: estimateReadingTime(content || p.rawContent),
  };
}

function sessionToJournalEntry(s: ParsedSession): JournalEntry {
  // Build content from session structure
  let content = "";

  if (s.summary) {
    content += s.summary + "\n\n";
  }

  if (s.accomplishments.length > 0) {
    content += "## Accomplishments\n\n";
    content += s.accomplishments.map((a) => `- ${a}`).join("\n");
    content += "\n\n";
  }

  if (s.blockers) {
    content += "## Blockers\n\n" + s.blockers + "\n\n";
  }

  if (s.nextSession) {
    content += "## Next Steps\n\n" + s.nextSession + "\n\n";
  }

  if (s.technicalNotes) {
    content += "## Technical Notes\n\n" + s.technicalNotes;
  }

  // Determine mood from status
  let mood: JournalEntry["mood"] = "neutral";
  const lowerStatus = s.status.toLowerCase();
  if (lowerStatus.includes("complete")) {
    mood = "win";
  } else if (lowerStatus.includes("block") || lowerStatus.includes("pause")) {
    mood = "struggle";
  }

  const tags = extractTags(s.title + " " + s.summary);

  return {
    slug: generateSlug(s.title, s.date),
    title: s.title,
    date: s.date,
    summary: s.summary,
    content: content.trim(),
    tags,
    mood,
    readingTime: estimateReadingTime(content),
  };
}

// =============================================================================
// COMBINED GETTERS (with fallback to static data)
// =============================================================================

import { timelineData, getTimelineSorted as getStaticTimelineSorted } from "@/content/timeline/data";
import { journalEntries, getEntriesSorted as getStaticEntriesSorted } from "@/content/journal/data";

/**
 * Get all timeline nodes, using static data as authoritative source
 * (static data has curated commits and content)
 */
export async function getAllTimelineNodes(): Promise<TimelineNode[]> {
  // Use static data as the authoritative source for timeline
  // Static data has correct commit hashes and curated content
  return getStaticTimelineSorted();
}

/**
 * Get all journal entries, using static data as authoritative source
 * (static data has correct slugs and curated content)
 */
export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  // Use static data as the authoritative source for journal
  // Static data has correct slugs that match URLs
  return getStaticEntriesSorted();
}

/**
 * Get a single journal entry by slug
 */
export async function getJournalEntryBySlug(slug: string): Promise<JournalEntry | undefined> {
  // Import directly from static data for efficiency
  const { getEntryBySlug } = await import("@/content/journal/data");
  return getEntryBySlug(slug);
}

/**
 * Get a single timeline node by ID
 */
export async function getTimelineNodeById(id: string): Promise<TimelineNode | undefined> {
  const nodes = await getAllTimelineNodes();
  return nodes.find((n) => n.id === id);
}

// =============================================================================
// BLOG CONTENT
// =============================================================================

import { blogPosts as staticBlogPosts, getPostsSorted as getStaticPostsSorted } from "@/content/blog/data";

/**
 * Get blog posts from devlog
 */
export async function getBlogFromDevlog(): Promise<ParsedBlogPost[]> {
  const posts: ParsedBlogPost[] = [];

  const blogDir = path.join(DEVLOG_PATH, "blog");
  const blogFiles = readDirectoryFiles(blogDir, /\.md$/);

  for (const file of blogFiles) {
    const source: ContentSource = {
      path: file.path,
      type: "devlog",
    };

    const parsed = parseBlogFile(file.content, source);
    posts.push(...parsed);
  }

  return posts;
}

// Extended type for blog posts with slug
export type BlogPostWithSlug = ParsedBlogPost & { slug: string };

/**
 * Convert static BlogPost to ParsedBlogPost format
 */
function staticBlogToParsed(post: typeof staticBlogPosts[0]): BlogPostWithSlug {
  return {
    title: post.title,
    status: "ready",
    hook: post.summary,
    content: post.content,
    rawContent: post.content,
    source: { path: `static/${post.slug}`, type: "static" },
    slug: post.slug,
  };
}

/**
 * Check if two blog post titles refer to the same content
 */
function isSamePost(title1: string, title2: string): boolean {
  // Normalize titles for comparison
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n1 = normalize(title1);
  const n2 = normalize(title2);

  // Check for exact match or significant overlap
  if (n1 === n2) return true;

  // Check if one contains key parts of the other (for "First Boot" variants)
  const keywords = ['firstboot', 'claudecode', 'debugging', 'robot'];
  const matches = keywords.filter(k => n1.includes(k) && n2.includes(k));
  return matches.length >= 2;
}

/**
 * Get all blog posts, sorted by status (ready > draft > idea)
 * Filters out drafts/ideas that have a matching published post
 */
export async function getAllBlogPosts(): Promise<BlogPostWithSlug[]> {
  // Start with static blog posts (these are published/ready)
  const staticPosts = getStaticPostsSorted().map(staticBlogToParsed);

  if (!devlogExists()) {
    return staticPosts;
  }

  try {
    const devlogPosts = await getBlogFromDevlog();

    // Filter devlog posts: exclude drafts/ideas that match a published static post
    const filteredDevlogPosts = devlogPosts.filter(devlogPost => {
      // If it's a draft or idea, check if we have a published version
      if (devlogPost.status === 'draft' || devlogPost.status === 'idea') {
        const hasPublished = staticPosts.some(staticPost =>
          isSamePost(staticPost.title, devlogPost.title)
        );
        return !hasPublished; // Exclude if published version exists
      }
      return true; // Keep ready/published posts
    });

    // Combine static and filtered devlog posts
    const allPosts: BlogPostWithSlug[] = [...staticPosts];
    for (const post of filteredDevlogPosts) {
      const exists = allPosts.some(p => isSamePost(p.title, post.title));
      if (!exists) {
        // Add slug to devlog posts
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
        allPosts.push({ ...post, slug });
      }
    }

    // Sort by status priority
    const statusPriority: Record<string, number> = {
      ready: 0,
      published: 1,
      draft: 2,
      idea: 3,
    };

    allPosts.sort((a, b) =>
      (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99)
    );

    return allPosts;
  } catch (error) {
    console.warn("Failed to read blog posts from devlog, using static:", error);
    return staticPosts;
  }
}

// =============================================================================
// IDEAS CONTENT
// =============================================================================

/**
 * Get ideas from devlog
 */
export async function getIdeasFromDevlog(): Promise<ParsedIdea[]> {
  const ideas: ParsedIdea[] = [];

  const ideasDir = path.join(DEVLOG_PATH, "ideas");
  const ideasFiles = readDirectoryFiles(ideasDir, /\.md$/);

  for (const file of ideasFiles) {
    const source: ContentSource = {
      path: file.path,
      type: "devlog",
    };

    const parsed = parseIdeasFile(file.content, source);
    ideas.push(...parsed);
  }

  // Sort by date descending
  ideas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return ideas;
}

/**
 * Get all ideas
 */
export async function getAllIdeas(): Promise<ParsedIdea[]> {
  if (!devlogExists()) {
    return [];
  }

  try {
    return await getIdeasFromDevlog();
  } catch (error) {
    console.warn("Failed to read ideas:", error);
    return [];
  }
}

/**
 * Get ideas filtered by category
 */
export async function getIdeasByCategory(category: string): Promise<ParsedIdea[]> {
  const ideas = await getAllIdeas();
  return ideas.filter((idea) =>
    idea.category?.toLowerCase() === category.toLowerCase()
  );
}

// Export types
export type { ContentSource, ParsedMilestone, ParsedJournalEntry, ParsedSession, ParsedBlogPost, ParsedIdea };
