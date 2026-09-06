import { motion } from "motion/react";
import { ArrowRight, Users } from "lucide-react";
import type { ChallengeRow } from "@/lib/challenges-service";
import { teamCoverage, type TeamWithMembers } from "@/lib/teams-service";

/**
 * Shared list used by both "Teams" and "My Missions" — the same stored teams,
 * presented from either the team or the mission side.
 */
export function TeamsPanel({
  view,
  entries,
  missions,
  loaded,
  onOpenTeam,
  onOpenMission,
}: {
  view: "teams" | "missions";
  entries: TeamWithMembers[];
  missions: ChallengeRow[];
  loaded: boolean;
  onOpenTeam: (teamId: string) => void;
  onOpenMission: (missionId: string) => void;
}) {
  if (!loaded) {
    return (
      <p className="mono-label px-1 py-16 text-center text-muted-foreground">
        LOADING TEAM RECORDS…
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="glass grid-floor rounded-2xl px-6 py-20 text-center">
        <p className="mono-label text-muted-foreground">
          {view === "teams" ? "NO MISSION TEAMS YET" : "NO ACTIVE MISSIONS YET"}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Open a civic mission from the Mission Board and use “FORM A SOLUTION TEAM” to
          assemble your first team.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="mono-label text-azure/90">
          {view === "teams" ? "YOUR MISSION TEAMS" : "YOUR ACTIVE MISSIONS"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Teams you lead or belong to, with their real skill coverage.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {entries.map((entry, i) => {
          const mission = missions.find((m) => m.id === entry.team.mission_id) ?? null;
          const coverage = teamCoverage(
            entry.members.map((m) => ({ skills: m.profile?.skills ?? [] })),
            mission?.recommended_skills ?? null,
          );
          const percent = coverage.percent ?? entry.team.skill_coverage;

          return (
            <motion.article
              key={entry.team.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              className="glass border-flow relative overflow-hidden rounded-2xl p-5"
            >
              <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-azure/20 opacity-25 blur-2xl" />
              <p className="mono-label text-muted-foreground">MISSION</p>
              <h3 className="relative mt-1.5 text-base font-semibold leading-snug sm:text-lg">
                {mission?.title ?? "Mission unavailable"}
              </h3>

              <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
                <div className="glass-soft rounded-xl p-3.5">
                  <p className="mono-label text-muted-foreground">TEAM</p>
                  <p className="mt-1.5 truncate text-sm font-medium">
                    {entry.team.team_name}
                  </p>
                </div>
                <div className="glass-soft rounded-xl p-3.5">
                  <p className="mono-label text-muted-foreground">MEMBERS</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Users className="h-3.5 w-3.5 text-cyan" />
                    {entry.members.length}
                  </p>
                </div>
                <div className="glass-soft rounded-xl p-3.5">
                  <p className="mono-label text-muted-foreground">SKILL COVERAGE</p>
                  <p className="mt-1.5 text-sm font-medium text-cyan">
                    {percent === null ? "—" : `${percent}%`}
                  </p>
                </div>
              </div>

              <div className="relative mt-4 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.14em] text-signal">
                  {entry.team.status.replace("_", " ")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    view === "teams"
                      ? onOpenTeam(entry.team.id)
                      : onOpenMission(entry.team.mission_id)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-azure/40 bg-azure/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-azure transition-colors hover:border-azure/70"
                >
                  {view === "teams" ? "OPEN TEAM" : "OPEN MISSION"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
