import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/auth/RoleGate";
import { IndustryDashboard } from "@/components/industry/IndustryDashboard";

const title = "Industry Console — Accelerate Solutions | CivicX";
const description =
  "The CivicX industry console: find reviewed university solutions and accelerate them with mentorship, technology, resources and funding.";

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
    <RoleGate role="industry">
      <IndustryDashboard />
    </RoleGate>
  ),
});

