import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { HomeContent } from "./home-content";
import { getAllTimelineNodes } from "@/lib/content";

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function Home() {
  const allNodes = await getAllTimelineNodes();
  const recentTimeline = allNodes.slice(0, 4);

  return (
    <>
      <Nav />
      <HomeContent recentTimeline={recentTimeline} />
      <Footer />
    </>
  );
}
