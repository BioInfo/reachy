import { NextResponse } from "next/server";
import { fetchGitHubActivity } from "@/lib/github";

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    const activity = await fetchGitHubActivity();

    return NextResponse.json(activity, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("GitHub API route error:", error);
    return NextResponse.json(
      {
        commits: [],
        issues: [],
        lastFetched: new Date().toISOString(),
        error: "Failed to fetch GitHub data",
      },
      { status: 500 }
    );
  }
}
