import { createFileRoute } from "@tanstack/react-router";
import { EmergencyCenter } from "@/components/emergency/EmergencyCenter";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";

const title = "Emergency Center — Verified Helplines & Threat Alerts | CivicX";
const description =
  "CivicX Emergency Center: verified emergency helplines, AI threat assessments on your reports, and a confirm-first call action. You always place the call.";

export const Route = createFileRoute("/_authenticated/emergency")({
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
      <main className="relative">
        <EmergencyCenter />
      </main>
    </div>
  ),
});
