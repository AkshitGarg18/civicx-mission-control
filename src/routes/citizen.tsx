import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { DashboardShell } from "@/components/civicx/DashboardShell";

const title = "Citizen Console — Report Challenges | CivicX";
const description =
  "The CivicX citizen console: report problems in your community, track their progress and see the impact of solved challenges.";

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
      <DashboardShell roleId="citizen" />
    </div>
  ),
});
