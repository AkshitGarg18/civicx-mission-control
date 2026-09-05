import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { SignupForm } from "@/components/auth/SignupForm";
import { parseAuthSearch } from "./login";

const title = "Join the CivicX Network — Create Your Account | CivicX";
const description =
  "Create a CivicX account as a citizen, university, industry partner or government authority and start turning real-world challenges into solutions.";

export const Route = createFileRoute("/signup")({
  validateSearch: parseAuthSearch,
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
  component: SignupPage,
});

function SignupPage() {
  const { role, redirect } = Route.useSearch();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <SignupForm role={role} redirect={redirect} />
    </div>
  );
}
