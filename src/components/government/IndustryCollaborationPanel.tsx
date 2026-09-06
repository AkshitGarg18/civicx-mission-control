import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { formatDate, type MissionRecord } from "@/lib/government-service";

/** Industry engagement across the civic pipeline, read-only. */
export function IndustryCollaborationPanel({
  missions,
  loaded,
  onOpen,
}: {
  missions: MissionRecord[];
  loaded: boolean;
  onOpen: (challengeId: string) => void;
}) {
  const rows = missions.flatMap((m) =>
    m.collaborations.map((c) => ({ mission: m, collaboration: c })),
  );

  return (
    <section className="space-y-5">
      <div>
        <p className="mono-label text-muted-foreground">CROSS-SECTOR SUPPORT</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          INDUSTRY COLLABORATION
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Which organisations are backing which civic solutions, and with what support.
        </p>
      </div>

      {!loaded ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          LOADING COLLABORATION RECORDS…
        </p>
      ) : rows.length === 0 ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          NO INDUSTRY COLLABORATIONS
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map(({ mission, collaboration }, i) => (
            <motion.article
              key={collaboration.row.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.4) }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mono-label text-muted-foreground">
                    MISSION #{mission.challenge.id.slice(0, 4).toUpperCase()}
                  </p>
                  <h3 className="mt-1 truncate text-lg font-semibold tracking-tight">
                    {collaboration.organization?.institution ??
                      collaboration.organization?.name ??
                      "Industry organisation"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Supporting: {mission.challenge.title}
                  </p>
                </div>
                <span className="rounded-lg border border-warn/40 bg-warn/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-warn">
                  {collaboration.row.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {collaboration.row.support_types.length === 0 ? (
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    NO SUPPORT TYPES RECORDED
                  </span>
                ) : (
                  collaboration.row.support_types.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg border border-violet/40 bg-violet/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-violet"
                    >
                      {t}
                    </span>
                  ))
                )}
              </div>

              {collaboration.row.next_step && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Next step: {collaboration.row.next_step}
                </p>
              )}

              <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                RECORDED {formatDate(collaboration.row.created_at)} · TEAM{" "}
                {mission.team?.team_name ?? "—"}
              </p>

              <button
                type="button"
                onClick={() => onOpen(mission.challenge.id)}
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
