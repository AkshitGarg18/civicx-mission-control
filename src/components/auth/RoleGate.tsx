import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { roleById, type RoleId } from "@/lib/civicx-roles";

function Pending({ label }: { label: string }) {
  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <span
          className="mx-auto block h-12 w-12 rounded-2xl border border-cyan/50 shadow-[var(--shadow-glow-cyan)] motion-safe:animate-spin"
          style={{ animationDuration: "2.4s" }}
        />
        <p className="mt-6 font-mono text-[11px] tracking-[0.26em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * Keeps a dashboard reachable only by its own role. Auth itself is enforced by
 * the `_authenticated` layout; this adds the role check and reroutes operators
 * who land on someone else's console.
 */
export function RoleGate({ role, children }: { role: RoleId; children: React.ReactNode }) {
  const { currentUser, currentProfile, loading } = useAuth();
  const navigate = useNavigate();
  const mismatched = !!currentProfile && currentProfile.role !== role;

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      void navigate({ to: "/login", search: { redirect: roleById[role].to }, replace: true });
      return;
    }
    if (mismatched && currentProfile) {
      void navigate({ to: roleById[currentProfile.role].to, replace: true });
    }
  }, [loading, currentUser, currentProfile, mismatched, navigate, role]);

  if (loading) return <Pending label="VERIFYING CREDENTIALS" />;
  if (!currentUser) return <Pending label="REDIRECTING TO ACCESS" />;
  if (mismatched) return <Pending label="REROUTING TO YOUR CONSOLE" />;

  return <>{children}</>;
}
