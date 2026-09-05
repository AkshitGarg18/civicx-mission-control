import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { OperatorPanel } from "@/components/auth/OperatorPanel";

const title = "Operator Profile | CivicX";
const description =
  "Review your CivicX operator profile: your name, role and the organisation you represent on the network.";

export const Route = createFileRoute("/_authenticated/profile")({
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
      <OperatorPanel view="profile" />
    </div>
  ),
});
