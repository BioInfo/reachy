/**
 * Content source types for the runreachyrun site.
 * These types represent the raw content as parsed from devlog files.
 */

// Source file metadata
export interface ContentSource {
  path: string;
  type: "devlog" | "session" | "static";
  lastModified?: Date;
}

// Parsed milestone entry from devlog/milestones/*.md
export interface ParsedMilestone {
  date: string;
  title: string;
  whatHappened: string;
  whyItMatters?: string;
  theMoment?: string;
  technicalNotes?: string[];
  links?: Record<string, string>;
  rawContent: string;
  source: ContentSource;
}

// Parsed journal entry from devlog/journal/*.md
export interface ParsedJournalEntry {
  date: string;
  title: string;
  duration?: string;
  goal?: string;
  sections: {
    heading: string;
    content: string;
  }[];
  rawContent: string;
  source: ContentSource;
}

// Parsed stream entry from devlog/stream/*.md
export interface ParsedStreamEntry {
  date: string;
  time: string;
  content: string;
  source: ContentSource;
}

// Parsed session from sessions/*.md
export interface ParsedSession {
  date: string;
  title: string;
  duration?: string;
  status: string;
  summary: string;
  accomplishments: string[];
  filesModified?: string[];
  blockers?: string;
  nextSession?: string;
  technicalNotes?: string;
  rawContent: string;
  source: ContentSource;
}

// Frontmatter that can be added to devlog files
export interface DevlogFrontmatter {
  // Common
  title?: string;
  date?: string;
  tags?: string[];

  // Timeline-specific
  type?: "milestone" | "breakthrough" | "failure" | "session" | "blog";
  mood?: "win" | "struggle" | "neutral" | "excited" | "triumph" | "learning";

  // Journal-specific
  slug?: string;
  readingTime?: number;
  linkedTimeline?: string[];
  linkedCommits?: string[];

  // Publishing
  published?: boolean;
  featured?: boolean;
}

// Parsed blog post/draft from devlog/blog/*.md
export interface ParsedBlogPost {
  title: string;
  status: "idea" | "draft" | "ready" | "published";
  hook?: string;
  angle?: string;
  target?: string; // "Run Data Run", "LinkedIn", etc.
  theme?: string;
  content: string;
  keyMoments?: string[];
  sourceJournal?: string; // Reference to journal entry
  rawContent: string;
  source: ContentSource;
}

// Parsed idea from devlog/ideas/*.md
export interface ParsedIdea {
  date: string;
  time?: string;
  category?: string; // App, Feature, etc.
  title: string;
  description: string;
  tags?: string[];
  source: ContentSource;
}

// Content cache for build-time optimization
export interface ContentCache {
  milestones: ParsedMilestone[];
  journal: ParsedJournalEntry[];
  stream: ParsedStreamEntry[];
  sessions: ParsedSession[];
  blog: ParsedBlogPost[];
  ideas: ParsedIdea[];
  lastUpdated: Date;
}
