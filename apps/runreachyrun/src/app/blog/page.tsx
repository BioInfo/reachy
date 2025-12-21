import { Suspense } from "react";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { BlogContent } from "./blog-content";
import { getAllBlogPosts } from "@/lib/content";

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <>
      <Nav />

      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <Suspense fallback={<BlogLoading />}>
            <BlogContent posts={posts} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

function BlogLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-[var(--bg-tertiary)] rounded w-32 mb-4"></div>
      <div className="h-6 bg-[var(--bg-tertiary)] rounded w-96 mb-12"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-[var(--bg-tertiary)] rounded-lg mb-4"></div>
      ))}
    </div>
  );
}
