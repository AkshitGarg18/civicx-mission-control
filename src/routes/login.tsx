import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { LoginForm } from "@/components/auth/LoginForm";
import type { RoleId } from "@/lib/civicx-roles";

const title = "Access CivicX — Sign In to the Mission Network | CivicX";
const description =
  "Sign in to the CivicX command network to report civic challenges, track missions and follow the impact you create.";

const validRoles: RoleId[] = ["citizen", "university", "industry", "government"];

export interface AuthSearch {
  role?: RoleId | undefined;
  redirect?: string | undefined;
}

export function parseAuthSearch(search: Record<string, unknown>): AuthSearch {
  const role = validRoles.includes(search["role"] as RoleId)
    ? (search["role"] as RoleId)
    : undefined;
  const raw = search["redirect"];
  const redirect =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;
  return { role, redirect };
}

export const Route = createFileRoute("/login")({
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
  component: LoginPage,
});

function LoginPage() {
  const { role, redirect } = Route.useSearch();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <LoginForm role={role} redirect={redirect} />
    </div>
  );
}
