import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { roleById } from "@/lib/civicx-roles";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-3">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm">{value}</p>
    </div>
  );
}

/** Placeholder profile / settings console for the signed-in operator. */
export function OperatorPanel({ view }: { view: "profile" | "settings" }) {
  const reduced = useReducedMotion();
  const { currentProfile, currentUser } = useAuth();
  const role = currentProfile?.role ?? "citizen";
  const home = roleById[role].to;

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground">
          CIVICX <span className="text-cyan">//</span>{" "}
          {view === "profile" ? "OPERATOR PROFILE" : "CONSOLE SETTINGS"}
        </span>
        <Link
          to={home}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO CONSOLE
        </Link>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="glass grid-floor mx-auto mt-10 max-w-3xl overflow-hidden rounded-[1.75rem] p-6 sm:p-9"
      >
        <h1 className="font-mono text-lg tracking-[0.22em]">
          {view === "profile" ? "OPERATOR PROFILE" : "CONSOLE SETTINGS"}
        </h1>

        {view === "profile" ? (
          <div className="mt-6">
            <Row label="NAME" value={currentProfile?.name ?? "Not set"} />
            <Row label="EMAIL" value={currentProfile?.email ?? currentUser?.email ?? "—"} />
            <Row label="ROLE" value={roleById[role].title} />
            <Row label="ORGANISATION" value={currentProfile?.institution ?? "—"} />
            <Row
              label="SKILLS"
              value={currentProfile?.skills?.join(", ") || "None recorded yet"}
            />
          </div>
        ) : (
          <div className="mt-6">
            <Row label="NOTIFICATIONS" value="Mission updates — coming soon" />
            <Row label="VISIBILITY" value="Public reporting profile — coming soon" />
            <Row label="LANGUAGE" value="English (default)" />
          </div>
        )}

        <p className="mono-label mt-8 text-muted-foreground">
          THIS CONSOLE IS INITIALISING — EDITING ARRIVES IN A LATER MISSION UPDATE
        </p>
      </motion.div>
    </div>
  );
}
