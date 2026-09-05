import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { DashboardShell } from "@/components/civicx/DashboardShell";

const title = "Industry Console — Accelerate Solutions | CivicX";
const description =
  "The CivicX industry console: find promising solutions and accelerate them with mentorship, technology, resources and funding.";

export const Route = createFileRoute("/_authenticated/industry")({
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
      <DashboardShell roleId="industry" />
    </div>
  ),
});
