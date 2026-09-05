import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/auth/RoleGate";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { DashboardShell } from "@/components/civicx/DashboardShell";

const title = "Government Console — Monitor & Measure Impact | CivicX";
const description =
  "The CivicX government console: monitor societal challenges, coordinate stakeholders and measure verified real-world impact.";

export const Route = createFileRoute("/_authenticated/government")({
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
    <RoleGate role="government">
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <DashboardShell roleId="government" />
    </div>
    </RoleGate>
  ),
});
