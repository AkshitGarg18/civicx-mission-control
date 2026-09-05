import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/auth/RoleGate";
import { UniversityDashboard } from "@/components/university/UniversityDashboard";

export const Route = createFileRoute("/_authenticated/university")({
  head: () => ({
    meta: [
      { title: "University Mission Control — CivicX" },
      {
        name: "description",
        content:
          "Discover real civic challenges reported by citizens and turn them into student-led innovation missions.",
      },
      { property: "og:title", content: "University Mission Control — CivicX" },
      {
        property: "og:description",
        content:
          "Discover real civic challenges reported by citizens and turn them into student-led innovation missions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UniversityRoute,
});

function UniversityRoute() {
  return (
    <RoleGate role="university">
      <UniversityDashboard />
    </RoleGate>
  );
}
