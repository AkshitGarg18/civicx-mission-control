import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/auth/RoleGate";
import { GovernmentDashboard } from "@/components/government/GovernmentDashboard";

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
      <GovernmentDashboard />
    </RoleGate>
  ),
});
