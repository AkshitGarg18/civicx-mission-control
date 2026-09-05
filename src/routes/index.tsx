import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { NavBar } from "@/components/civicx/NavBar";
import { Hero } from "@/components/civicx/Hero";
import { Forces } from "@/components/civicx/Forces";
import { LiveWorld } from "@/components/civicx/LiveWorld";
import { Missions } from "@/components/civicx/Missions";
import { HowItWorks } from "@/components/civicx/HowItWorks";
import { FinalCTA } from "@/components/civicx/FinalCTA";
import { SiteFooter } from "@/components/civicx/SiteFooter";

const title = "CivicX — Turn Real-World Problems Into Real-World Solutions";
const description =
  "CivicX connects citizens, universities, industry and government to turn societal challenges into measurable impact through a live mission-control platform.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <NavBar />
      <main>
        <Hero />
        <Forces />
        <LiveWorld />
        <Missions />
        <HowItWorks />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
