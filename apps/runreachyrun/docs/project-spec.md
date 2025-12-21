# runreachyrun.com — Project Specification

## The Meta-Story

This isn't just a project site. It's a demonstration of recursive AI-assisted development: Claude Code is helping build a Reachy Mini Lite robot, while simultaneously building the web app that documents building the Reachy, while also writing the blog posts about all of it. The site should make this layered narrative visible and explorable.

The owner (Justin) maintains rundatarun.io, a technical blog with 10,000+ followers covering AI and data science. runreachyrun.com extends that voice into robotics and embodied AI, with an emphasis on showing the development process itself — including Claude Code's role in it.

## Core Identity

**Domain:** runreachyrun.com  
**Parallel brand:** Sibling to rundatarun.io  
**Voice:** Technical but accessible, enthusiastic without hype, shows the work  
**Audience:** AI/ML practitioners, robotics enthusiasts, developers curious about Claude Code workflows  

## Content Sources

The site aggregates and presents content from multiple platforms:

| Source | Content Type | Integration |
|--------|--------------|-------------|
| GitHub (BioInfo/reachy) | Code, commits, issues, README | GitHub API |
| Hugging Face | Community apps, Spaces | HF API / embeds |
| Dev Journal | Session notes, decisions, failures, wins | Local markdown / structured data |
| Blog Posts | Polished narratives derived from journal | Markdown with frontmatter |
| Claude Code Logs | Prompts, iterations, conversation snippets | Curated exports |

## Feature Set

### 1. Interactive Build Timeline

A visual, explorable journey through the project's evolution.

**Implementation ideas:**
- Vertical or horizontal timeline with expandable nodes
- Each node represents a meaningful milestone (not every commit)
- Nodes can contain: journal entry excerpt, commit links, blog post link, embedded media, Claude Code conversation snippet
- Filter/search by: date range, content type (hardware, software, Claude, wins, failures), tags
- Smooth animations on expand/collapse

**Data structure per node:**
```typescript
interface TimelineNode {
  id: string;
  date: string;
  title: string;
  type: 'milestone' | 'session' | 'breakthrough' | 'failure' | 'blog';
  summary: string;
  content?: {
    journal?: string;
    commits?: string[];
    blogPost?: string;
    media?: string[];
    claudeSnippet?: {
      prompt: string;
      response: string;
      context?: string;
    };
  };
  tags: string[];
}
```

### 2. Live Dashboard

Real-time (or near-real-time) project vitals.

**Widgets to consider:**
- GitHub activity: recent commits, open issues/PRs, contribution graph
- Hugging Face Spaces: embedded or linked, with usage stats if available
- "Currently working on" status: manually updated or inferred from recent activity
- Build health: last successful run, any blockers
- Quick stats: total commits, apps published, blog posts, hours logged

**Design note:** Should feel alive without being noisy. Subtle animations, meaningful updates only.

### 3. The Claude Code Angle

This is the differentiator. Make the AI collaboration visible and educational.

**Approaches:**
- "How this was built" toggle on any section showing the Claude Code interaction that produced it
- Dedicated section showing prompt engineering evolution
- Side-by-side: what was asked → what was generated → what was shipped
- Diffs showing Claude's output vs. final code
- "Lessons learned" about working with Claude Code effectively

**Content format:**
```typescript
interface ClaudeCodeSession {
  id: string;
  date: string;
  goal: string;
  prompts: {
    text: string;
    response: string;
    iterations?: number;
  }[];
  outcome: 'success' | 'partial' | 'pivot';
  learnings?: string;
  linkedCommits?: string[];
}
```

### 4. Dev Journal as First-Class Content

Not buried in a blog archive — explorable, filterable, searchable.

**Features:**
- Card-based or list view of entries
- Rich filtering: by date, tag, mood (wins/struggles), content type
- Full-text search
- Reading time estimates
- Links to related entries, commits, blog posts
- Optional "raw" view showing original notes vs. polished version

### 5. Reachy Visualizer (Stretch Goal)

A 3D model that brings the hardware to life.

**Options:**
- Three.js with a Reachy model (URDF or custom)
- Spline for more design-forward approach
- Interactive: pose the arm, trigger animations
- Could show "current capabilities" — what the robot can do at this stage
- Before/after or timeline showing capability progression

### 6. Blog Integration

Polished long-form content, likely cross-posted to rundatarun.io.

**Requirements:**
- Clean typography, code syntax highlighting
- Estimated reading time
- Tags and categories
- Related posts
- Social sharing
- Comments optional (or link to discussion elsewhere)

### 7. Apps Showcase

Embedded or linked Hugging Face Spaces with context.

**Per app:**
- Title, description, date published
- Embedded Space or prominent link
- "How it was built" expandable section
- Link to source code
- Related journal entries / blog posts

## Technical Architecture

### Recommended Stack

**Framework:** Next.js 14+ (App Router)
- Server components for performance
- API routes for GitHub/HF integrations
- Static generation where possible, ISR for dynamic content

**Styling:** Tailwind CSS + custom design system
- No generic templates — this should look like nothing else
- Dark mode as default (or only)
- Thoughtful motion with Framer Motion

**Content:** MDX for blog posts, structured JSON/YAML for timeline and journal
- Consider a headless CMS later, but start with files in repo

**3D (if implemented):** Three.js or Spline
- Keep bundle size reasonable — lazy load

**Hosting:** Vercel (natural fit for Next.js)

**Analytics:** Plausible or Fathom (privacy-respecting)

### Data Flow

```
GitHub API ──────────┐
                     │
Hugging Face API ────┼──→ Next.js API Routes ──→ React Components
                     │
Local MDX/JSON ──────┘
```

### Directory Structure (Suggested)

```
runreachyrun/
├── app/
│   ├── page.tsx              # Landing / dashboard
│   ├── timeline/
│   │   └── page.tsx          # Interactive timeline
│   ├── journal/
│   │   ├── page.tsx          # Journal index
│   │   └── [slug]/page.tsx   # Individual entry
│   ├── blog/
│   │   ├── page.tsx          # Blog index
│   │   └── [slug]/page.tsx   # Individual post
│   ├── apps/
│   │   └── page.tsx          # HuggingFace apps showcase
│   ├── claude/
│   │   └── page.tsx          # Claude Code sessions/learnings
│   └── api/
│       ├── github/
│       └── huggingface/
├── components/
│   ├── timeline/
│   ├── dashboard/
│   ├── journal/
│   ├── blog/
│   └── ui/                   # Design system primitives
├── content/
│   ├── journal/              # MDX or JSON entries
│   ├── blog/                 # MDX posts
│   ├── timeline/             # Timeline data
│   └── claude-sessions/      # Claude Code logs
├── lib/
│   ├── github.ts
│   ├── huggingface.ts
│   └── content.ts
└── public/
    └── media/
```

## Design Philosophy

### Visual Identity

- **Bold but not loud:** Strong typography, intentional whitespace, accent colors used sparingly
- **Dark-first:** Easier on the eyes for developers, makes code and media pop
- **Motion with purpose:** Animations should reveal information or guide attention, never just decorate
- **Show the work:** Raw, unpolished elements (terminal output, handwritten notes, sketches) mixed with polished design
- **One of a kind:** No templates, no generic hero sections, no stock patterns

### Typography

- Monospace for code and technical elements
- A distinctive sans-serif for headings
- Readable serif or sans for body text
- Consider variable fonts for performance

### Color

- Dark background (not pure black)
- Warm or cool accent (pick one, use consistently)
- Semantic colors for: success/wins, failures/struggles, Claude-generated, human-written

### Interactions

- Hover states that reveal more information
- Smooth transitions between views
- Progressive disclosure — don't overwhelm, let users drill down
- Keyboard navigation support

## Content Strategy

### Voice Guidelines

Mirror rundatarun.io but with more focus on process and exploration:

- First person, conversational
- Technical accuracy without jargon gatekeeping
- Honest about failures and dead ends
- Enthusiastic about discoveries
- Credit Claude Code explicitly when it contributes

### Update Cadence

- Journal: Updated per session (could be daily during active development)
- Timeline: Updated when milestones are reached
- Blog: Weekly or bi-weekly polished posts
- Dashboard: Auto-updates from APIs

### Cross-Promotion

- Link to rundatarun.io where relevant
- Twitter/X account (@runreachyrun) for updates
- Consider RSS feed for blog

## Phase 1 Deliverables

For initial launch, prioritize:

1. **Landing page** with project intro and current status
2. **Timeline** with at least 10 meaningful nodes
3. **Journal** with 5+ entries
4. **GitHub integration** showing recent activity
5. **One embedded Hugging Face app**
6. **One "How Claude built this" showcase**

Stretch for Phase 1:
- Blog with 2-3 posts
- Basic 3D Reachy visualization

## Open Questions

- Should the site have its own repo or live in BioInfo/reachy?
- How to handle Claude Code conversation exports — manual curation or automated?
- Comments/community features, or keep discussion on Twitter/GitHub?
- Cross-post blog content to rundatarun.io, or keep separate?

---

## For Claude Code

When starting development:

1. **Begin with the design system** — establish colors, typography, spacing, component primitives before building pages
2. **Start with static content** — get the structure and styling right before adding API integrations
3. **Build the timeline component first** — it's the centerpiece and will inform other design decisions
4. **Use placeholder content** that matches the real data structure
5. **Commit frequently** with meaningful messages (this is content for the site itself!)
6. **Document decisions** in the dev journal as you go

The goal is a site that's genuinely impressive — something that makes people pause and explore, not just glance and leave. Take risks with the design. Surprise me.
