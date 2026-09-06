import { motion } from "motion/react";
import { ArrowRight, Building2, MapPin, Users } from "lucide-react";
import { buildLifecycle, formatDate, type MissionRecord } from "@/lib/government-service";
import { LifecycleTrack } from "./LifecycleTrack";

const priorityTone: Record<string, string> = {
  CRITICAL: "text-destructive border-destructive/40 bg-destructive/10",
  HIGH: "text-destructive border-destructive/40 bg-destructive/10",
  MEDIUM: "text-warn border-warn/40 bg-warn/10",
  LOW: "text-cyan border-cyan/40 bg-cyan/10",
};

export function MissionCardRow({
  mission,
  onOpen,
}: {
  mission: MissionRecord;
  onOpen: (id: string) => void;
}) {
  const { challenge, team, proposal, review, collaborations } = mission;
  const stages = buildLifecycle(mission);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-5 transition-colors hover:border-violet/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-label text-muted-foreground">
            MISSION #{challenge.id.slice(0, 4).toUpperCase()} · {formatDate(challenge.created_at)}
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">
            {challenge.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {challenge.location_name ?? "Location pending"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${priorityTone[challenge.priority] ?? priorityTone["MEDIUM"]}`}
          >
            {challenge.priority}
          </span>
          <span className="rounded-lg border border-border bg-muted/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            {challenge.category ?? "UNCATEGORISED"}
          </span>
          <span className="rounded-lg border border-violet/40 bg-violet/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-violet">
            {challenge.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {challenge.ai_summary && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {challenge.ai_summary}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Fact
          icon={<Users className="h-3.5 w-3.5" />}
          label="UNIVERSITY TEAM"
          value={team ? team.team_name : "Not assigned"}
        />
        <Fact
          label="PROPOSAL"
          value={proposal ? proposal.status.replace(/_/g, " ") : "None submitted"}
        />
        <Fact
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="INDUSTRY"
          value={
            collaborations.length === 0
              ? "No interest yet"
              : collaborations[0]!.row.status.replace(/_/g, " ")
          }
        />
      </div>

      {review && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-signal">
          AI FEASIBILITY: {review.technical_feasibility} · IMPACT: {review.impact_potential}
        </p>
      )}

      <div className="mt-4">
        <LifecycleTrack stages={stages.filter((s) => s.state !== "pending")} compact />
      </div>

      <button
        type="button"
        onClick={() => onOpen(challenge.id)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet/40 bg-violet/10 px-3.5 py-2 font-mono text-[10px] tracking-[0.18em] text-violet transition-colors hover:bg-violet/20"
      >
        OPEN MISSION CONTROL
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.article>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-soft rounded-xl px-3 py-2.5">
      <p className="mono-label flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-foreground/90">{value}</p>
    </div>
  );
}

/** Real challenge records only — nothing is generated to fill this list. */
export function MissionsPanel({
  missions,
  loaded,
  onOpen,
}: {
  missions: MissionRecord[];
  loaded: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <p className="mono-label text-muted-foreground">CIVIC MISSION OVERVIEW</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">CIVIC MISSIONS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every reported challenge with its university, solution and industry state.
        </p>
      </div>

      {!loaded ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          LOADING CIVIC RECORDS…
        </p>
      ) : missions.length === 0 ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          NO ACTIVE CIVIC MISSIONS
        </p>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <MissionCardRow key={mission.challenge.id} mission={mission} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
