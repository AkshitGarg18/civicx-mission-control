import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { CitizenDashboard } from "@/components/citizen/CitizenDashboard";

const title = "Citizen Mission Control | CivicX";
const description =
  "Report civic challenges, track how your reports progress through AI analysis and university matching, and see the impact you create in your community.";

export const Route = createFileRoute("/citizen")({
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
  component: () => (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <CitizenDashboard />
    </div>
  ),
});
