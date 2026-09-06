import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { formatDate, type MissionRecord } from "@/lib/government-service";

/**
 * Universities and their solutions, read-only. Only submitted proposals are
 * visible to government — drafts stay private to the team.
 */
export function TeamsSolutionsPanel({
  missions,
  loaded,
  onOpen,
}: {
  missions: MissionRecord[];
  loaded: boolean;
  onOpen: (challengeId: string) => void;
}) {
  const withTeams = missions.filter((m) => m.team);

  return (
    <section className="space-y-5">
      <div>
        <p className="mono-label text-muted-foreground">UNIVERSITY RESPONSE</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">TEAMS &amp; SOLUTIONS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Which universities are solving what, and how far each solution has progressed.
        </p>
      </div>

      {!loaded ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          LOADING TEAM RECORDS…
        </p>
      ) : withTeams.length === 0 ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          NO UNIVERSITY TEAMS ACTIVE
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {withTeams.map((m, i) => (
            <motion.article
              key={m.team!.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.4) }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="mono-label text-muted-foreground">
                    {m.university?.institution ?? m.university?.name ?? "UNIVERSITY"}
                  </p>
                  <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">
                    {m.team!.team_name}
                  </h3>
                </div>
                <span className="rounded-lg border border-azure/40 bg-azure/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-azure">
                  {m.team!.status.replace(/_/g, " ")}
                </span>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Mission: <span className="text-foreground/90">{m.challenge.title}</span>
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="glass-soft rounded-xl px-3 py-2">
                  <dt className="mono-label text-muted-foreground">MEMBERS</dt>
                  <dd className="mt-1 text-sm tabular-nums">{m.teamSize}</dd>
                </div>
                <div className="glass-soft rounded-xl px-3 py-2">
                  <dt className="mono-label text-muted-foreground">SKILL COVERAGE</dt>
                  <dd className="mt-1 text-sm tabular-nums">
                    {m.team!.skill_coverage !== null && m.team!.skill_coverage !== undefined
                      ? `${m.team!.skill_coverage}%`
                      : "—"}
                  </dd>
                </div>
                <div className="glass-soft rounded-xl px-3 py-2">
                  <dt className="mono-label text-muted-foreground">PROPOSAL</dt>
                  <dd className="mt-1 text-sm">
                    {m.proposal ? m.proposal.status.replace(/_/g, " ") : "Not submitted"}
                  </dd>
                </div>
                <div className="glass-soft rounded-xl px-3 py-2">
                  <dt className="mono-label text-muted-foreground">AI REVIEW</dt>
                  <dd className="mt-1 text-sm">
                    {m.review ? m.review.technical_feasibility : "Pending"}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                TEAM FORMED {formatDate(m.team!.created_at)}
              </p>

              <button
                type="button"
                onClick={() => onOpen(m.challenge.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet/40 bg-violet/10 px-3.5 py-2 font-mono text-[10px] tracking-[0.18em] text-violet transition-colors hover:bg-violet/20"
              >
                VIEW MISSION CONTROL
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
