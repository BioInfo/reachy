// GitHub API utilities
// Works with public repos without auth (60 req/hr limit)
// Add GITHUB_TOKEN env var for higher limits (5000 req/hr)

const GITHUB_API = "https://api.github.com";
const REPO_OWNER = "BioInfo";
const REPO_NAME = "reachy";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  created_at: string;
  labels: { name: string; color: string }[];
}

export interface CommitData {
  sha: string;
  message: string;
  date: string;
  url: string;
}

export interface IssueData {
  number: number;
  title: string;
  state: "open" | "closed";
  url: string;
  createdAt: string;
  labels: string[];
}

export interface GitHubActivityData {
  commits: CommitData[];
  issues: IssueData[];
  lastFetched: string;
  error?: string;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "runreachyrun-site",
  };

  // Use token if available for higher rate limits
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export async function fetchRecentCommits(limit = 10): Promise<CommitData[]> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=${limit}`,
      {
        headers: getHeaders(),
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.warn("GitHub API rate limit exceeded");
        return [];
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits: GitHubCommit[] = await response.json();

    return commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0], // First line only
      date: commit.commit.author.date,
      url: commit.html_url,
    }));
  } catch (error) {
    console.error("Failed to fetch commits:", error);
    return [];
  }
}

export async function fetchRecentIssues(
  state: "open" | "closed" | "all" = "all",
  limit = 10
): Promise<IssueData[]> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=${state}&per_page=${limit}&sort=updated`,
      {
        headers: getHeaders(),
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.warn("GitHub API rate limit exceeded");
        return [];
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const issues: GitHubIssue[] = await response.json();

    // Filter out pull requests (they come through the issues endpoint)
    return issues
      .filter((issue) => !("pull_request" in issue))
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        createdAt: issue.created_at,
        labels: issue.labels.map((l) => l.name),
      }));
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    return [];
  }
}

export async function fetchGitHubActivity(): Promise<GitHubActivityData> {
  try {
    const [commits, issues] = await Promise.all([
      fetchRecentCommits(5),
      fetchRecentIssues("all", 5),
    ]);

    return {
      commits,
      issues,
      lastFetched: new Date().toISOString(),
    };
  } catch (error) {
    return {
      commits: [],
      issues: [],
      lastFetched: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get repository stats
export async function fetchRepoStats(): Promise<{
  stars: number;
  forks: number;
  openIssues: number;
} | null> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: getHeaders(),
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
      openIssues: data.open_issues_count,
    };
  } catch {
    return null;
  }
}
