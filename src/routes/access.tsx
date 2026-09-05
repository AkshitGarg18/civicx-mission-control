import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { RoleSelect } from "@/components/civicx/RoleSelect";

const title = "Platform Access — Choose Your Mission Role | CivicX";
const description =
  "Enter the CivicX command network as a citizen, university, industry partner or government authority and start turning challenges into solutions.";

export const Route = createFileRoute("/access")({
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
  component: AccessPage,
});

function AccessPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <RoleSelect />
    </div>
  );
}
