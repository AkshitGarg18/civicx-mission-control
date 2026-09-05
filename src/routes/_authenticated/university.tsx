import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { DashboardShell } from "@/components/civicx/DashboardShell";

const title = "University Console — Build Solution Teams | CivicX";
const description =
  "The CivicX university console: discover challenges matched to your students' expertise and build teams that ship real solutions.";

export const Route = createFileRoute("/_authenticated/university")({
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
      <DashboardShell roleId="university" />
    </div>
  ),
});
