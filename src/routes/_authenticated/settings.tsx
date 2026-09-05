import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { OperatorPanel } from "@/components/auth/OperatorPanel";

const title = "Console Settings | CivicX";
const description =
  "Console preferences for your CivicX operator account — notification, privacy and network options.";

export const Route = createFileRoute("/_authenticated/settings")({
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
      <OperatorPanel view="settings" />
    </div>
  ),
});
