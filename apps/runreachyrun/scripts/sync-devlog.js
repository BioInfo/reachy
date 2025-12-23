#!/usr/bin/env node
/**
 * Unified Content Sync for runreachyrun.com
 *
 * Reads from devlog and sessions, generates:
 * - src/content/timeline/data.ts - Timeline entries
 * - src/content/journal/data.ts - Journal entries
 * - src/content/claude/data.ts - Claude session data
 *
 * Run: npm run sync-devlog
 */

const fs = require("fs");
const path = require("path");

// Paths
const SITE_ROOT = path.join(__dirname, "..");
const DEVLOG_PATH = path.join(SITE_ROOT, "../../devlog");
const SESSIONS_PATH = path.join(SITE_ROOT, "../../sessions");

const OUTPUT = {
  timeline: path.join(SITE_ROOT, "src/content/timeline/data.ts"),
  journal: path.join(SITE_ROOT, "src/content/journal/data.ts"),
  claude: path.join(SITE_ROOT, "src/content/claude/data.ts"),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSlug(title, date) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${slug}-${date.replace(/-/g, "")}`;
}

function escapeString(str) {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

function escapeQuotes(str) {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
}

function extractTags(text) {
  const tags = [];
  const lowerText = text.toLowerCase();
  const patterns = {
    hardware: /hardware|robot|physical|servo|motor|usb/,
    software: /software|code|api|sdk|app|daemon/,
    "claude-code": /claude|ai|llm|gpt/,
    camera: /camera|vision|video|pose|mediapipe/,
    audio: /audio|music|sound|beat|dj/,
    simulation: /simulation|mujoco|sim/,
    "focus-guardian": /focus.?guardian|productivity|body.?double/,
    "dj-reactor": /dj.?reactor|music|dance/,
    echo: /\becho\b|companion|memory|proactive/,
    huggingface: /hugging.?face|hf|space/,
    infrastructure: /daemon|launch|config|setup|vercel|deploy/,
    rag: /rag|embedding|vector|search|chat/,
    meta: /site|website|runreachyrun|documentation/,
  };
  for (const [tag, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowerText)) tags.push(tag);
  }
  return [...new Set(tags)].slice(0, 6);
}

function determineType(title, content, status) {
  const lower = (title + " " + content).toLowerCase();
  if (lower.includes("first") || lower.includes("breakthrough")) return "breakthrough";
  if (lower.includes("fail") || lower.includes("block") || lower.includes("dead end")) return "failure";
  if (lower.includes("launch") || lower.includes("deploy") || lower.includes("complete") ||
      lower.includes("live") || lower.includes("accepted") || lower.includes("shipped")) return "milestone";
  if (status && status.toLowerCase().includes("block")) return "failure";
  return "session";
}

function determineMood(content) {
  const lower = content.toLowerCase();
  if (lower.includes("finally") || lower.includes("success") || lower.includes("working") || lower.includes("fixed")) return "win";
  if (lower.includes("failed") || lower.includes("blocked") || lower.includes("frustrat")) return "struggle";
  if (lower.includes("exciting") || lower.includes("breakthrough") || lower.includes("first")) return "excited";
  return "neutral";
}

// ============================================================================
// TIMELINE PARSING (existing logic, enhanced)
// ============================================================================

function parseMilestonesFile(content) {
  const milestones = [];
  const sections = content.split(/\n##\s+/).slice(1);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    if (lines.length === 0) continue;

    const headerMatch = lines[0].match(/^(?:Dec\s+(\d+)|(\d{4}-\d{2}-\d{2})):\s*(.+)$/i);
    if (!headerMatch) continue;

    const dayNum = headerMatch[1];
    const fullDate = headerMatch[2];
    const title = headerMatch[3].trim();
    let date = fullDate || `2025-12-${dayNum.padStart(2, "0")}`;

    const milestone = { date, title, whatHappened: "", whyItMatters: "", theMoment: "" };
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
      } else if (line.startsWith("**Commit:**")) {
        const m = line.match(/`([a-f0-9]+)`/);
        if (m) milestone.commit = m[1];
      } else if (line.startsWith("**")) {
        currentField = "";
      } else if (currentField && line.trim()) {
        milestone[currentField] += " " + line.trim();
      }
    }

    if (!milestone.whatHappened) {
      milestone.whatHappened = lines.slice(1).join(" ").trim().slice(0, 300);
    }
    milestones.push(milestone);
  }
  return milestones;
}

function parseSessionFile(content) {
  const lines = content.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) return null;

  const title = titleLine.replace(/^#\s+/, "").replace(/^Session:\s*/i, "");
  let date = "", status = "", summary = "";
  const accomplishments = [];
  let section = "";

  for (const line of lines) {
    if (line.startsWith("**Date:**")) date = line.replace("**Date:**", "").trim();
    else if (line.startsWith("**Status:**")) status = line.replace("**Status:**", "").trim();
    else if (line.startsWith("## Summary")) section = "summary";
    else if (line.startsWith("## Accomplishments")) section = "accomplishments";
    else if (line.startsWith("## ")) section = "";
    else if (section === "summary" && line.trim() && !line.startsWith("---")) summary += " " + line.trim();
    else if (section === "accomplishments" && line.match(/^\d+\.\s+\*\*/)) {
      accomplishments.push(line.replace(/^\d+\.\s+\*\*/, "").replace(/\*\*.*/, "").trim());
    }
  }

  if (!date) return null;
  return { date, title, status: status || "Completed", summary: summary.trim(), accomplishments };
}

function parseStreamFile(content, filename) {
  const entries = [];
  const fileMatch = filename.match(/(\d{4})-W(\d{2})\.md$/);
  if (!fileMatch) return entries;

  const year = fileMatch[1];
  const daySections = content.split(/\n##\s+/).slice(1);

  const months = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };

  const milestonePatterns = [/\bMVP complete\b/i, /\bfirst community\b/i, /\bfirst external\b/i,
    /\blaunched?\b.*\bproduction\b/i, /\bshipped\b.*\bcomplete\b/i, /\bpublished to\b/i, /\bBOTH APPS ACCEPTED\b/i];

  for (const section of daySections) {
    const lines = section.trim().split("\n");
    if (lines.length === 0) continue;

    const dateMatch = lines[0].match(/(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+(\w+)\s+(\d+)/i);
    if (!dateMatch) continue;

    const month = months[dateMatch[1].toLowerCase()];
    if (!month) continue;
    const date = `${year}-${month}-${dateMatch[2].padStart(2, "0")}`;

    const entryRegex = /\*\*(\d{2}:\d{2})\*\*\s*-\s*(.+?)(?=\n\*\*\d{2}:\d{2}\*\*|\n##|\n---|\n\n\n|$)/gs;
    const fullText = lines.slice(1).join("\n");

    let match;
    while ((match = entryRegex.exec(fullText)) !== null) {
      const entryText = match[2].trim();
      const isMilestone = milestonePatterns.some((p) => p.test(entryText));
      if (!isMilestone) continue;

      let title = "";
      const boldMatch = entryText.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch[1].length >= 15 && boldMatch[1].length <= 80) {
        title = boldMatch[1];
      } else {
        const firstSentence = entryText.split(/[.!]/)[0].replace(/\*\*/g, "").trim();
        if (firstSentence.length >= 20 && firstSentence.length <= 80) title = firstSentence;
      }
      if (!title) continue;

      entries.push({ date, title, summary: entryText.replace(/\*\*/g, "").replace(/\n/g, " ").trim().slice(0, 350) });
    }
  }
  return entries;
}

// ============================================================================
// JOURNAL PARSING
// ============================================================================

function parseJournalFile(content, filename) {
  const entries = [];

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = {};
  if (frontmatterMatch) {
    frontmatterMatch[1].split("\n").forEach(line => {
      const [key, ...vals] = line.split(":");
      if (key && vals.length) frontmatter[key.trim()] = vals.join(":").trim().replace(/^["']|["']$/g, "");
    });
  }

  // Split by date headers (## 2025-12-20: or ## YYYY-MM-DD:)
  const sections = content.split(/\n##\s+(\d{4}-\d{2}-\d{2}):\s*/);

  for (let i = 1; i < sections.length; i += 2) {
    const date = sections[i];
    const body = sections[i + 1];
    if (!body) continue;

    const lines = body.trim().split("\n");
    const title = lines[0].trim();

    // Extract full content until next section
    let fullContent = lines.slice(1).join("\n").trim();

    // Find code blocks
    const codeBlocks = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(fullContent)) !== null) {
      codeBlocks.push({ language: codeMatch[1] || "text", code: codeMatch[2].trim() });
    }

    // Extract summary (first paragraph)
    const summaryMatch = fullContent.match(/^([^#\n][\s\S]*?)(?=\n\n|\n###|\n---)/);
    const summary = summaryMatch ? summaryMatch[1].replace(/\n/g, " ").trim().slice(0, 200) : title;

    // Determine reading time (~200 words per minute)
    const wordCount = fullContent.split(/\s+/).length;
    const readingTime = Math.max(2, Math.ceil(wordCount / 200));

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

    entries.push({
      slug,
      date,
      title,
      summary,
      content: fullContent,
      tags: extractTags(title + " " + fullContent),
      mood: determineMood(fullContent),
      readingTime,
      codeBlocks,
    });
  }

  return entries;
}

// ============================================================================
// CLAUDE SESSION PARSING
// ============================================================================

function parseClaudeSessionFromFile(content, filename) {
  const lines = content.split("\n");
  const titleLine = lines.find((l) => l.startsWith("# "));
  if (!titleLine) return null;

  const title = titleLine.replace(/^#\s+/, "").replace(/^Session:\s*/i, "");
  let date = "", status = "", summary = "", duration = "";
  const accomplishments = [];
  const technicalNotes = [];
  let section = "";

  for (const line of lines) {
    if (line.startsWith("**Date:**")) date = line.replace("**Date:**", "").trim();
    else if (line.startsWith("**Status:**")) status = line.replace("**Status:**", "").trim();
    else if (line.startsWith("**Duration:**")) duration = line.replace("**Duration:**", "").trim();
    else if (line.startsWith("## Summary")) section = "summary";
    else if (line.startsWith("## Accomplishments")) section = "accomplishments";
    else if (line.startsWith("## Technical Notes")) section = "technical";
    else if (line.startsWith("## ")) section = "";
    else if (section === "summary" && line.trim() && !line.startsWith("---")) summary += " " + line.trim();
    else if (section === "accomplishments" && line.match(/^\d+\.\s+\*\*/)) {
      const text = line.replace(/^\d+\.\s+/, "").trim();
      accomplishments.push(text);
    }
    else if (section === "technical" && line.trim() && !line.startsWith("---")) {
      technicalNotes.push(line.replace(/^-\s+/, "").trim());
    }
  }

  if (!date) return null;

  // Extract code blocks
  const codeBlocks = [];
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let codeMatch;
  while ((codeMatch = codeRegex.exec(content)) !== null) {
    if (codeMatch[2].trim().length > 20) {
      codeBlocks.push({ language: codeMatch[1] || "text", code: codeMatch[2].trim() });
    }
  }

  // Generate Claude session structure
  const id = filename.replace(".md", "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const goal = title.replace(/^Session:\s*/i, "");
  const outcome = status.toLowerCase().includes("block") ? "blocked" :
                  status.toLowerCase().includes("complet") ? "success" : "in-progress";

  // Generate learnings from accomplishments
  const learnings = accomplishments
    .filter(a => a.includes("**"))
    .map(a => a.replace(/\*\*/g, "").split(":")[0].trim())
    .slice(0, 4);

  // Generate prompts from content patterns
  const prompts = [];
  const promptPatterns = content.match(/\*\*What I said:\*\*\s*"([^"]+)"/g);
  if (promptPatterns) {
    promptPatterns.forEach(p => {
      const prompt = p.replace(/\*\*What I said:\*\*\s*"/, "").replace(/"$/, "");
      prompts.push({ prompt, insight: "Claude provided systematic debugging assistance." });
    });
  }

  // Derive feature from filename
  let linkedFeature = "";
  if (filename.includes("focus-guardian")) linkedFeature = "Focus Guardian";
  else if (filename.includes("dj-reactor")) linkedFeature = "DJ Reactor";
  else if (filename.includes("echo")) linkedFeature = "Reachy Echo";
  else if (filename.includes("runreachyrun")) linkedFeature = "Website";
  else if (filename.includes("huggingface")) linkedFeature = "HuggingFace Integration";

  return {
    id,
    date,
    goal,
    outcome,
    summary: summary.trim(),
    prompts: prompts.length > 0 ? prompts : undefined,
    codeSnippets: codeBlocks.length > 0 ? codeBlocks.slice(0, 2) : undefined,
    learnings: learnings.length > 0 ? learnings : undefined,
    linkedFeature: linkedFeature || undefined,
  };
}

// ============================================================================
// DATA READING
// ============================================================================

function readTimelineNodes() {
  const nodes = [];

  // Milestones
  const milestonesDir = path.join(DEVLOG_PATH, "milestones");
  if (fs.existsSync(milestonesDir)) {
    fs.readdirSync(milestonesDir).filter(f => f.endsWith(".md")).forEach(file => {
      const content = fs.readFileSync(path.join(milestonesDir, file), "utf-8");
      parseMilestonesFile(content).forEach(m => {
        nodes.push({
          id: generateSlug(m.title, m.date),
          date: m.date,
          title: m.title,
          type: determineType(m.title, m.whatHappened),
          summary: m.whatHappened.trim().slice(0, 300),
          content: {
            commits: m.commit ? [m.commit] : undefined,
            claudeSnippet: m.whyItMatters ? {
              prompt: "What makes this significant?",
              response: m.whyItMatters.trim().slice(0, 300),
              context: m.theMoment ? m.theMoment.trim().slice(0, 200) : undefined,
            } : undefined,
          },
          tags: extractTags(m.title + " " + m.whatHappened),
        });
      });
    });
  }

  // Sessions
  if (fs.existsSync(SESSIONS_PATH)) {
    fs.readdirSync(SESSIONS_PATH).filter(f => f.endsWith(".md")).forEach(file => {
      const content = fs.readFileSync(path.join(SESSIONS_PATH, file), "utf-8");
      const session = parseSessionFile(content);
      if (session) {
        nodes.push({
          id: generateSlug(session.title, session.date),
          date: session.date,
          title: session.title,
          type: determineType(session.title, session.summary, session.status),
          summary: session.summary || session.accomplishments.slice(0, 2).join(". "),
          content: {
            journal: session.accomplishments.length > 0 ? session.accomplishments.join("; ") : undefined,
          },
          tags: extractTags(session.title + " " + session.summary),
        });
      }
    });
  }

  // Stream
  const streamDir = path.join(DEVLOG_PATH, "stream");
  if (fs.existsSync(streamDir)) {
    fs.readdirSync(streamDir).filter(f => f.endsWith(".md")).forEach(file => {
      const content = fs.readFileSync(path.join(streamDir, file), "utf-8");
      parseStreamFile(content, file).forEach(entry => {
        nodes.push({
          id: generateSlug(entry.title, entry.date),
          date: entry.date,
          title: entry.title,
          type: determineType(entry.title, entry.summary),
          summary: entry.summary,
          content: {},
          tags: extractTags(entry.title + " " + entry.summary),
        });
      });
    });
  }

  return nodes;
}

function readJournalEntries() {
  const entries = [];
  const journalDir = path.join(DEVLOG_PATH, "journal");

  if (fs.existsSync(journalDir)) {
    fs.readdirSync(journalDir).filter(f => f.endsWith(".md")).forEach(file => {
      const content = fs.readFileSync(path.join(journalDir, file), "utf-8");
      parseJournalFile(content, file).forEach(entry => entries.push(entry));
    });
  }

  return entries;
}

function readClaudeSessions() {
  const sessions = [];

  if (fs.existsSync(SESSIONS_PATH)) {
    fs.readdirSync(SESSIONS_PATH).filter(f => f.endsWith(".md")).forEach(file => {
      const content = fs.readFileSync(path.join(SESSIONS_PATH, file), "utf-8");
      const session = parseClaudeSessionFromFile(content, file);
      if (session) sessions.push(session);
    });
  }

  return sessions;
}

// ============================================================================
// OUTPUT GENERATORS
// ============================================================================

function generateTimelineTS(nodes) {
  const unique = [];
  const seen = new Set();
  nodes.forEach(n => { if (!seen.has(n.id)) { unique.push(n); seen.add(n.id); } });
  unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let output = `import { TimelineNode } from "@/types";

// Auto-generated from devlog — Last synced: ${new Date().toISOString()}
// Run: npm run sync-devlog
export const timelineData: TimelineNode[] = [\n`;

  unique.forEach(n => {
    output += `  {
    id: "${n.id}",
    date: "${n.date}",
    title: "${escapeQuotes(n.title)}",
    type: "${n.type}",
    summary: "${escapeQuotes(n.summary)}",
    content: {${n.content.commits ? `\n      commits: [${n.content.commits.map(c => `"${c}"`).join(", ")}],` : ""}${n.content.journal ? `\n      journal: "${escapeQuotes(n.content.journal)}",` : ""}${n.content.claudeSnippet ? `
      claudeSnippet: {
        prompt: "${escapeQuotes(n.content.claudeSnippet.prompt)}",
        response: "${escapeQuotes(n.content.claudeSnippet.response)}",${n.content.claudeSnippet.context ? `
        context: "${escapeQuotes(n.content.claudeSnippet.context)}",` : ""}
      },` : ""}
    },
    tags: [${n.tags.map(t => `"${t}"`).join(", ")}],
  },\n`;
  });

  output += `];

export function getTimelineSorted(): TimelineNode[] {
  return [...timelineData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export function getTimelineByType(type: TimelineNode["type"]): TimelineNode[] {
  return timelineData.filter((node) => node.type === type);
}
export function getTimelineByTag(tag: string): TimelineNode[] {
  return timelineData.filter((node) => node.tags.includes(tag));
}
`;
  return output;
}

function generateJournalTS(entries) {
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let output = `import { JournalEntry } from "@/types";

// Auto-generated from devlog/journal — Last synced: ${new Date().toISOString()}
// Run: npm run sync-devlog
export const journalEntries: JournalEntry[] = [\n`;

  entries.forEach(e => {
    output += `  {
    slug: "${e.slug}",
    title: "${escapeQuotes(e.title)}",
    date: "${e.date}",
    summary: "${escapeQuotes(e.summary)}",
    content: \`${escapeString(e.content)}\`,
    tags: [${e.tags.map(t => `"${t}"`).join(", ")}],
    mood: "${e.mood}",
    readingTime: ${e.readingTime},
    linkedTimeline: [],
  },\n`;
  });

  output += `];

export function getAllSlugs(): string[] {
  return journalEntries.map((e) => e.slug);
}
export function getEntryBySlug(slug: string): JournalEntry | undefined {
  return journalEntries.find((e) => e.slug === slug);
}
export function getEntriesSorted(): JournalEntry[] {
  return [...journalEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
`;
  return output;
}

function generateClaudeTS(sessions) {
  sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let output = `// Auto-generated from sessions — Last synced: ${new Date().toISOString()}
// Run: npm run sync-devlog

export interface ClaudeSession {
  id: string;
  date: string;
  goal: string;
  outcome: "success" | "blocked" | "in-progress";
  summary: string;
  prompts?: { prompt: string; insight: string; code?: { language: string; code: string; description: string } }[];
  codeSnippets?: { language: string; code: string; description?: string }[];
  learnings?: string[];
  linkedFeature?: string;
}

export const claudeSessions: ClaudeSession[] = [\n`;

  sessions.forEach(s => {
    output += `  {
    id: "${s.id}",
    date: "${s.date}",
    goal: "${escapeQuotes(s.goal)}",
    outcome: "${s.outcome}",
    summary: "${escapeQuotes(s.summary)}",${s.prompts ? `
    prompts: [${s.prompts.map(p => `
      { prompt: "${escapeQuotes(p.prompt)}", insight: "${escapeQuotes(p.insight)}" }`).join(",")}
    ],` : ""}${s.codeSnippets ? `
    codeSnippets: [${s.codeSnippets.map(c => `
      { language: "${c.language}", code: \`${escapeString(c.code)}\` }`).join(",")}
    ],` : ""}${s.learnings ? `
    learnings: [${s.learnings.map(l => `"${escapeQuotes(l)}"`).join(", ")}],` : ""}${s.linkedFeature ? `
    linkedFeature: "${s.linkedFeature}",` : ""}
  },\n`;
  });

  output += `];

export function getClaudeSessionsSorted(): ClaudeSession[] {
  return [...claudeSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
`;
  return output;
}

// ============================================================================
// MAIN
// ============================================================================

function syncDevlog() {
  console.log("Unified Content Sync for runreachyrun.com");
  console.log("=========================================");
  console.log(`Source: ${DEVLOG_PATH}`);
  console.log(`Sessions: ${SESSIONS_PATH}\n`);

  if (!fs.existsSync(DEVLOG_PATH)) {
    console.log("Devlog path not found, skipping sync");
    return;
  }

  // Timeline
  const timelineNodes = readTimelineNodes();
  const timelineTS = generateTimelineTS(timelineNodes);
  fs.writeFileSync(OUTPUT.timeline, timelineTS, "utf-8");
  console.log(`Timeline: ${timelineNodes.length} entries → ${OUTPUT.timeline}`);

  // Journal
  const journalEntries = readJournalEntries();
  if (journalEntries.length > 0) {
    const journalTS = generateJournalTS(journalEntries);
    fs.writeFileSync(OUTPUT.journal, journalTS, "utf-8");
    console.log(`Journal: ${journalEntries.length} entries → ${OUTPUT.journal}`);
  } else {
    console.log(`Journal: No entries found in devlog/journal/`);
  }

  // Claude Sessions
  const claudeSessions = readClaudeSessions();
  if (claudeSessions.length > 0) {
    const claudeTS = generateClaudeTS(claudeSessions);
    fs.writeFileSync(OUTPUT.claude, claudeTS, "utf-8");
    console.log(`Claude: ${claudeSessions.length} sessions → ${OUTPUT.claude}`);
  } else {
    console.log(`Claude: No sessions found in sessions/`);
  }

  console.log("\nDone!");
}

syncDevlog();
module.exports = { syncDevlog };
