#!/usr/bin/env node
/**
 * Sync devlog content to static timeline data
 *
 * Reads from:
 * - devlog/milestones/*.md - Key moments and breakthroughs
 * - devlog/stream/*.md - Running commentary (significant entries only)
 * - sessions/*.md - Development session logs
 *
 * Outputs:
 * - src/content/timeline/data.ts - Static timeline data
 *
 * Run: npm run sync-devlog
 */

const fs = require("fs");
const path = require("path");

// Paths relative to script location
const SITE_ROOT = path.join(__dirname, "..");
const DEVLOG_PATH = path.join(SITE_ROOT, "../../devlog");
const SESSIONS_PATH = path.join(SITE_ROOT, "../../sessions");
const OUTPUT_PATH = path.join(SITE_ROOT, "src/content/timeline/data.ts");

/**
 * Generate a URL-safe slug from title and date
 */
function generateSlug(title, date) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${slug}-${date.replace(/-/g, "")}`;
}

/**
 * Extract tags from text content
 */
function extractTags(text) {
  const tags = [];
  const lowerText = text.toLowerCase();

  const topicPatterns = {
    hardware: /hardware|robot|physical|servo|motor|usb/,
    software: /software|code|api|sdk|app|daemon/,
    "claude-code": /claude|ai|llm|gpt/,
    camera: /camera|vision|video|pose/,
    audio: /audio|music|sound|beat|dj/,
    simulation: /simulation|mujoco|sim/,
    "focus-guardian": /focus.?guardian|productivity|body.?double/,
    "dj-reactor": /dj.?reactor|music|dance/,
    "echo": /\becho\b|companion|memory|proactive/,
    huggingface: /hugging.?face|hf|space/,
    infrastructure: /daemon|launch|config|setup|vercel|deploy/,
    rag: /rag|embedding|vector|search|chat/,
    meta: /site|website|runreachyrun|documentation/,
  };

  for (const [tag, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(lowerText)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)].slice(0, 6);
}

/**
 * Determine timeline node type from content
 */
function determineType(title, content, status) {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerTitle.includes("first") || lowerTitle.includes("breakthrough")) {
    return "breakthrough";
  }
  if (
    lowerTitle.includes("fail") ||
    lowerTitle.includes("block") ||
    lowerTitle.includes("dead end") ||
    lowerContent.includes("blocked")
  ) {
    return "failure";
  }
  if (
    lowerTitle.includes("launch") ||
    lowerTitle.includes("deploy") ||
    lowerTitle.includes("publish") ||
    lowerTitle.includes("complete") ||
    lowerTitle.includes("live") ||
    lowerTitle.includes("accepted") ||
    lowerTitle.includes("shipped")
  ) {
    return "milestone";
  }
  if (status && status.toLowerCase().includes("block")) {
    return "failure";
  }

  return "session";
}

/**
 * Parse a milestones markdown file
 */
function parseMilestonesFile(content) {
  const milestones = [];

  // Split by milestone headers (## Dec XX: or ## YYYY-MM-DD:)
  const sections = content.split(/\n##\s+/).slice(1);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    if (lines.length === 0) continue;

    // Parse header: "Dec 20: Title" or "2025-12-20: Title"
    const headerMatch = lines[0].match(
      /^(?:Dec\s+(\d+)|(\d{4}-\d{2}-\d{2})):\s*(.+)$/i
    );
    if (!headerMatch) continue;

    const dayNum = headerMatch[1];
    const fullDate = headerMatch[2];
    const title = headerMatch[3].trim();

    // Determine date
    let date;
    if (fullDate) {
      date = fullDate;
    } else if (dayNum) {
      // Assume December 2025 for "Dec XX" format
      date = `2025-12-${dayNum.padStart(2, "0")}`;
    } else {
      continue;
    }

    // Parse sections
    const milestone = {
      date,
      title,
      whatHappened: "",
    };

    let currentField = "";
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("**What happened:**")) {
        currentField = "whatHappened";
        milestone.whatHappened = line.replace("**What happened:**", "").trim();
      } else if (line.startsWith("**Why it matters:**")) {
        currentField = "whyItMatters";
        milestone.whyItMatters = line.replace("**Why it matters:**", "").trim();
      } else if (line.startsWith("**The moment:**")) {
        currentField = "theMoment";
        milestone.theMoment = line.replace("**The moment:**", "").trim();
      } else if (line.startsWith("**Technical")) {
        currentField = "technicalNotes";
        milestone.technicalNotes = "";
      } else if (line.startsWith("**Commit:**")) {
        const commitMatch = line.match(/`([a-f0-9]+)`/);
        if (commitMatch) {
          milestone.commit = commitMatch[1];
        }
      } else if (line.startsWith("**Journal:**")) {
        milestone.journal = line.replace("**Journal:**", "").trim();
      } else if (line.startsWith("**") || line.startsWith("---")) {
        currentField = "";
      } else if (currentField && line.trim()) {
        if (currentField === "whatHappened") {
          milestone.whatHappened += " " + line.trim();
        } else if (currentField === "whyItMatters") {
          milestone.whyItMatters = (milestone.whyItMatters || "") + " " + line.trim();
        } else if (currentField === "theMoment") {
          milestone.theMoment = (milestone.theMoment || "") + " " + line.trim();
        } else if (currentField === "technicalNotes") {
          milestone.technicalNotes = (milestone.technicalNotes || "") + "\n" + line;
        }
      }
    }

    // If no structured content, use the raw text as whatHappened
    if (!milestone.whatHappened) {
      milestone.whatHappened = lines.slice(1).join(" ").trim().slice(0, 300);
    }

    milestones.push(milestone);
  }

  return milestones;
}

/**
 * Parse a session markdown file
 */
function parseSessionFile(content) {
  const lines = content.split("\n");

  // Find title (first # header)
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) return null;

  const title = titleLine.replace(/^#\s+/, "").replace(/^Session:\s*/i, "");

  // Find metadata
  let date = "";
  let status = "";
  let summary = "";
  const accomplishments = [];
  let blockers = "";
  let nextSession = "";

  let section = "";
  for (const line of lines) {
    if (line.startsWith("**Date:**")) {
      date = line.replace("**Date:**", "").trim();
    } else if (line.startsWith("**Status:**")) {
      status = line.replace("**Status:**", "").trim();
    } else if (line.startsWith("## Summary")) {
      section = "summary";
    } else if (line.startsWith("## Accomplishments")) {
      section = "accomplishments";
    } else if (line.startsWith("## Blockers")) {
      section = "blockers";
    } else if (line.startsWith("## Next")) {
      section = "next";
    } else if (line.startsWith("## ")) {
      section = "";
    } else if (section === "summary" && line.trim() && !line.startsWith("---")) {
      summary += " " + line.trim();
    } else if (section === "accomplishments" && line.startsWith("- ")) {
      accomplishments.push(line.replace(/^-\s+/, ""));
    } else if (section === "blockers" && line.trim() && !line.startsWith("---")) {
      blockers += " " + line.trim();
    } else if (section === "next" && line.trim() && !line.startsWith("---")) {
      nextSession += " " + line.trim();
    }
  }

  if (!date) return null;

  return {
    date,
    title,
    status: status || "Completed",
    summary: summary.trim(),
    accomplishments,
    blockers: blockers.trim() || undefined,
    nextSession: nextSession.trim() || undefined,
  };
}

/**
 * Parse a stream markdown file for significant entries
 * Stream format: ## Day, Month DD headers with **HH:MM** - description entries
 */
function parseStreamFile(content, filename) {
  const entries = [];

  // Extract year and week from filename (e.g., "2025-W52.md")
  const fileMatch = filename.match(/(\d{4})-W(\d{2})\.md$/);
  if (!fileMatch) return entries;

  const year = fileMatch[1];

  // Split by day headers (## Sunday, December 22)
  const daySections = content.split(/\n##\s+/).slice(1);

  for (const section of daySections) {
    const lines = section.trim().split("\n");
    if (lines.length === 0) continue;

    // Parse day header: "Sunday, December 22" or "Monday, December 22"
    const dayHeader = lines[0];
    const dateMatch = dayHeader.match(/(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(\w+)\s+(\d+)/i);
    if (!dateMatch) continue;

    const monthName = dateMatch[1];
    const day = dateMatch[2].padStart(2, "0");

    // Convert month name to number
    const months = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12"
    };
    const month = months[monthName.toLowerCase()];
    if (!month) continue;

    const date = `${year}-${month}-${day}`;

    // Find significant entries (those with key phrases or substantial content)
    const significantPatterns = [
      /\bcomplete\b/i,
      /\bfirst\b/i,
      /\blaunched?\b/i,
      /\bshipped\b/i,
      /\bdeployed\b/i,
      /\baccepted\b/i,
      /\bMVP\b/i,
      /\bbreakthrough\b/i,
      /\bfinally\b.*\b(?:fixed|working|solved)\b/i,
      /\bworking\b.*\bnow\b/i,
      /\bstarted\b.*\*\*[^*]+\*\*/i, // Started **Project Name**
    ];

    // Parse timestamped entries
    const entryRegex = /\*\*(\d{2}:\d{2})\*\*\s*-\s*(.+?)(?=\n\*\*\d{2}:\d{2}\*\*|\n##|\n---|\n\n\n|$)/gs;
    const fullText = lines.slice(1).join("\n");

    let match;
    while ((match = entryRegex.exec(fullText)) !== null) {
      const time = match[1];
      const entryText = match[2].trim();

      // Check if this is a significant entry
      const isSignificant = significantPatterns.some(p => p.test(entryText)) ||
                           entryText.length > 300; // Long entries are usually significant

      if (!isSignificant) continue;

      // Extract a title from the entry (first sentence or bold text)
      let title = "";
      const boldMatch = entryText.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        title = boldMatch[1];
      } else {
        // Use first sentence as title
        const firstSentence = entryText.split(/[.!?]/)[0];
        title = firstSentence.slice(0, 60).trim();
      }

      // Clean up the summary
      const summary = entryText
        .replace(/\*\*/g, "") // Remove bold markers
        .replace(/\n/g, " ")  // Flatten newlines
        .trim()
        .slice(0, 350);

      entries.push({
        date,
        time,
        title,
        summary,
      });
    }
  }

  return entries;
}

/**
 * Convert parsed milestone to timeline node
 */
function milestoneToTimelineNode(m) {
  const type = determineType(m.title, m.whatHappened + (m.whyItMatters || ""));
  const tags = extractTags(m.title + " " + m.whatHappened + " " + (m.whyItMatters || ""));

  return {
    id: generateSlug(m.title, m.date),
    date: m.date,
    title: m.title,
    type,
    summary: m.whatHappened.trim().slice(0, 300),
    content: {
      journal: m.journal,
      commits: m.commit ? [m.commit] : undefined,
      claudeSnippet: m.whyItMatters
        ? {
            prompt: "What makes this significant?",
            response: m.whyItMatters.trim().slice(0, 300),
            context: m.theMoment ? m.theMoment.trim().slice(0, 200) : undefined,
          }
        : undefined,
    },
    tags,
  };
}

/**
 * Convert parsed session to timeline node
 */
function sessionToTimelineNode(s) {
  const type = determineType(s.title, s.summary, s.status);
  const tags = extractTags(s.title + " " + s.summary);

  return {
    id: generateSlug(s.title, s.date),
    date: s.date,
    title: s.title,
    type,
    summary: s.summary || s.accomplishments.slice(0, 2).join(". "),
    content: {
      journal: s.accomplishments.length > 0 ? s.accomplishments.join("; ") : undefined,
    },
    tags,
  };
}

/**
 * Convert parsed stream entry to timeline node
 */
function streamEntryToTimelineNode(entry) {
  const type = determineType(entry.title, entry.summary);
  const tags = extractTags(entry.title + " " + entry.summary);

  return {
    id: generateSlug(entry.title, entry.date),
    date: entry.date,
    title: entry.title,
    type,
    summary: entry.summary,
    content: {},
    tags,
  };
}

/**
 * Read all timeline nodes from devlog
 */
function readDevlogNodes() {
  const nodes = [];

  // Read milestones
  const milestonesDir = path.join(DEVLOG_PATH, "milestones");
  if (fs.existsSync(milestonesDir)) {
    const files = fs.readdirSync(milestonesDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(milestonesDir, file), "utf-8");
      const milestones = parseMilestonesFile(content);
      for (const m of milestones) {
        nodes.push(milestoneToTimelineNode(m));
      }
    }
  }

  // Read sessions
  if (fs.existsSync(SESSIONS_PATH)) {
    const files = fs.readdirSync(SESSIONS_PATH).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(SESSIONS_PATH, file), "utf-8");
      const session = parseSessionFile(content);
      if (session) {
        nodes.push(sessionToTimelineNode(session));
      }
    }
  }

  // Read stream files for significant entries
  const streamDir = path.join(DEVLOG_PATH, "stream");
  if (fs.existsSync(streamDir)) {
    const files = fs.readdirSync(streamDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(streamDir, file), "utf-8");
      const streamEntries = parseStreamFile(content, file);
      for (const entry of streamEntries) {
        nodes.push(streamEntryToTimelineNode(entry));
      }
    }
  }

  return nodes;
}

/**
 * Escape string for TypeScript output
 */
function escapeString(str) {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

/**
 * Format timeline node for TypeScript output
 */
function formatNode(node, indent = "  ") {
  const lines = [];
  lines.push(`${indent}{`);
  lines.push(`${indent}  id: "${node.id}",`);
  lines.push(`${indent}  date: "${node.date}",`);
  lines.push(`${indent}  title: "${escapeString(node.title)}",`);
  lines.push(`${indent}  type: "${node.type}",`);
  lines.push(`${indent}  summary:`);
  lines.push(`${indent}    "${escapeString(node.summary)}",`);
  lines.push(`${indent}  content: {`);

  if (node.content.journal) {
    lines.push(`${indent}    journal: "${escapeString(node.content.journal)}",`);
  }
  if (node.content.commits && node.content.commits.length > 0) {
    lines.push(`${indent}    commits: [${node.content.commits.map((c) => `"${c}"`).join(", ")}],`);
  }
  if (node.content.claudeSnippet) {
    lines.push(`${indent}    claudeSnippet: {`);
    lines.push(`${indent}      prompt: "${escapeString(node.content.claudeSnippet.prompt)}",`);
    lines.push(`${indent}      response:`);
    lines.push(`${indent}        "${escapeString(node.content.claudeSnippet.response)}",`);
    if (node.content.claudeSnippet.context) {
      lines.push(`${indent}      context: "${escapeString(node.content.claudeSnippet.context)}",`);
    }
    lines.push(`${indent}    },`);
  }

  lines.push(`${indent}  },`);
  lines.push(`${indent}  tags: [${node.tags.map((t) => `"${t}"`).join(", ")}],`);
  lines.push(`${indent}},`);

  return lines.join("\n");
}

/**
 * Main sync function
 */
function syncDevlog() {
  console.log("Syncing devlog to timeline...");

  // Check paths
  console.log(`  DEVLOG_PATH: ${DEVLOG_PATH}`);
  console.log(`  SESSIONS_PATH: ${SESSIONS_PATH}`);
  console.log(`  OUTPUT_PATH: ${OUTPUT_PATH}`);

  if (!fs.existsSync(DEVLOG_PATH)) {
    console.log("  Devlog path not found, skipping sync");
    return;
  }

  // Read devlog nodes
  const devlogNodes = readDevlogNodes();
  console.log(`  Found ${devlogNodes.length} entries in devlog`);

  // Deduplicate by ID
  const seenIds = new Set();
  const uniqueNodes = [];
  for (const node of devlogNodes) {
    if (!seenIds.has(node.id)) {
      uniqueNodes.push(node);
      seenIds.add(node.id);
    }
  }

  // Sort by date descending
  uniqueNodes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log(`  Merged to ${uniqueNodes.length} unique entries`);

  // Generate output file
  const output = `import { TimelineNode } from "@/types";

// Timeline data — auto-generated from devlog
// Last synced: ${new Date().toISOString()}
// To update: npm run sync-devlog
export const timelineData: TimelineNode[] = [
${uniqueNodes.map((n) => formatNode(n)).join("\n")}
];

// Helper to get timeline nodes sorted by date (newest first)
export function getTimelineSorted(): TimelineNode[] {
  return [...timelineData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Helper to filter timeline by type
export function getTimelineByType(
  type: TimelineNode["type"]
): TimelineNode[] {
  return timelineData.filter((node) => node.type === type);
}

// Helper to filter timeline by tag
export function getTimelineByTag(tag: string): TimelineNode[] {
  return timelineData.filter((node) => node.tags.includes(tag));
}
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf-8");
  console.log(`  Written to ${OUTPUT_PATH}`);
  console.log("Done!");
}

// Run directly
syncDevlog();

module.exports = { syncDevlog, readDevlogNodes };
