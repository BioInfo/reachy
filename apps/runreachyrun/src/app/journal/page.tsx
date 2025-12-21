import { Suspense } from "react";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { JournalContent } from "./journal-content";
import { getAllJournalEntries } from "@/lib/content";

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function JournalPage() {
  const entries = await getAllJournalEntries();

  // Extract unique tags
  const tagSet = new Set<string>();
  entries.forEach((entry) => entry.tags.forEach((tag) => tagSet.add(tag)));
  const availableTags = Array.from(tagSet).sort();

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Suspense fallback={<JournalLoading />}>
            <JournalContent entries={entries} availableTags={availableTags} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

function JournalLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-[var(--bg-tertiary)] rounded w-32 mb-4"></div>
      <div className="h-12 bg-[var(--bg-tertiary)] rounded w-64 mb-4"></div>
      <div className="h-6 bg-[var(--bg-tertiary)] rounded w-96 mb-12"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-[var(--bg-tertiary)] rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}
