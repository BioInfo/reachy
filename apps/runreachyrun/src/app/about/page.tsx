import { Metadata } from "next";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About — runreachyrun",
  description: "About Justin Johnson and the Reachy Mini Lite project. Building a robot with Claude Code, documenting the journey in public.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <AboutContent />
        </div>
      </main>
      <Footer />
    </>
  );
}
