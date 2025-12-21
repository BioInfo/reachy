import { Suspense } from "react";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { TimelineContent } from "./timeline-content";
import { getAllTimelineNodes } from "@/lib/content";

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function TimelinePage() {
  const nodes = await getAllTimelineNodes();

  // Extract unique tags
  const tagSet = new Set<string>();
  nodes.forEach((node) => node.tags.forEach((tag) => tagSet.add(tag)));
  const availableTags = Array.from(tagSet).sort();

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Suspense fallback={<TimelineLoading />}>
            <TimelineContent nodes={nodes} availableTags={availableTags} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

function TimelineLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-[var(--bg-tertiary)] rounded w-32 mb-4"></div>
      <div className="h-12 bg-[var(--bg-tertiary)] rounded w-64 mb-4"></div>
      <div className="h-6 bg-[var(--bg-tertiary)] rounded w-96 mb-12"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 mb-8">
          <div className="w-3 h-3 bg-[var(--bg-tertiary)] rounded-full"></div>
          <div className="flex-1 h-32 bg-[var(--bg-tertiary)] rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}
