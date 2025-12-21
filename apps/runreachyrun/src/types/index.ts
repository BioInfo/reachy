// =============================================================================
// RUNREACHYRUN DATA TYPES
// =============================================================================

// Timeline node — represents a meaningful milestone in the build
export interface TimelineNode {
  id: string;
  date: string; // ISO date string
  title: string;
  type: "milestone" | "session" | "breakthrough" | "failure" | "blog";
  summary: string;
  content?: {
    journal?: string; // markdown content or reference
    commits?: string[]; // GitHub commit SHAs
    blogPost?: string; // slug reference
    media?: MediaItem[];
    claudeSnippet?: ClaudeSnippet;
  };
  tags: string[];
}

export interface MediaItem {
  type: "image" | "video" | "embed";
  src: string;
  alt?: string;
  caption?: string;
}

export interface ClaudeSnippet {
  prompt: string;
  response: string;
  context?: string;
}

// Claude Code session — for the /claude section
export interface ClaudeCodeSession {
  id: string;
  date: string;
  goal: string;
  prompts: {
    text: string;
    response: string;
    iterations?: number;
  }[];
  outcome: "success" | "partial" | "pivot";
  learnings?: string;
  linkedCommits?: string[];
}

// Journal entry — dev journal content
export interface JournalEntry {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string; // markdown
  tags: string[];
  mood?: "win" | "struggle" | "neutral" | "excited";
  readingTime?: number; // minutes
  linkedTimeline?: string[]; // timeline node IDs
  linkedCommits?: string[];
}

// Blog post — polished long-form content
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  publishedAt?: string;
  summary: string;
  content: string; // markdown
  tags: string[];
  readingTime?: number;
  coverImage?: string;
  crossPostedTo?: string; // e.g., "rundatarun.io"
}

// Dashboard stats — for the live dashboard
export interface DashboardStats {
  totalCommits: number;
  appsPublished: number;
  blogPosts: number;
  journalEntries: number;
  hoursLogged?: number;
  currentFocus?: string;
  lastActivity?: string;
}

// GitHub activity — recent commits and issues
export interface GitHubActivity {
  commits: {
    sha: string;
    message: string;
    date: string;
    url: string;
  }[];
  issues: {
    number: number;
    title: string;
    state: "open" | "closed";
    url: string;
  }[];
}

// HuggingFace app — for the apps showcase
export interface HuggingFaceApp {
  id: string;
  name: string;
  description: string;
  publishedAt: string;
  spaceUrl: string;
  sourceUrl?: string;
  tags: string[];
  howItWasBuilt?: string; // markdown
  linkedJournal?: string[]; // journal slugs
}

// Full app page data — for individual app pages
export interface AppPage {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: "live" | "development" | "coming-soon";
  icon: string; // emoji or icon name

  // Links
  huggingFaceUrl?: string;
  githubUrl: string;

  // Media
  heroVideo?: string;
  screenshots: { src: string; alt: string; caption?: string }[];
  demoEmbed?: string; // HF Space URL for iframe

  // Content
  features: { icon: string; title: string; description: string }[];
  howItWorks: { step: number; title: string; description: string }[];

  // Installation
  prerequisites: string[];
  quickStart: string; // code/commands
  configuration?: string;
  troubleshooting?: { problem: string; solution: string }[];

  // Tech
  techStack: string[];

  // Connections
  journalEntries: string[]; // slugs
  timelineNodes: string[]; // ids

  // Claude Code story
  claudeContributions?: {
    title: string;
    description: string;
    prompt?: string;
  }[];
  learnings?: string[];

  // Meta
  lastUpdated: string;
}

// Navigation item
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  isActive?: boolean;
}

// Project status for dashboard
export type ProjectStatus = "active" | "paused" | "completed" | "blocked";

export interface ProjectInfo {
  name: string;
  status: ProjectStatus;
  description: string;
  lastUpdated: string;
}
