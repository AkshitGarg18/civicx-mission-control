import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin, Users, X } from "lucide-react";
import { PriorityChip, StatusChip } from "@/components/civicx/StatusChip";
import { statusMap, type ChallengeRow } from "@/lib/challenges-service";
import { getChallengeById } from "@/lib/challenges-service";
import { categoryLabel } from "@/lib/university-data";
import { TeamFormationModal } from "./TeamFormationModal";
import { useAssistantFocus } from "@/lib/assistant-context";

/** The same MapLibre map the citizen dashboard uses. */
const ChallengeMap = lazy(() => import("@/components/citizen/ChallengeMap"));

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Cinematic mission brief for a real stored challenge. */
export function UniversityMissionDetail({
  challengeId,
  onClose,
  onTeamCreated,
  onViewTeam,
}: {
  challengeId: string | null;
  onClose: () => void;
  onTeamCreated?: () => void;
  onViewTeam?: (teamId: string) => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const [row, setRow] = useState<ChallengeRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);

  useEffect(() => {
    if (!challengeId) return;
    let cancelled = false;
    setRow(null);
    setError(null);

    void (async () => {
      try {
        const challenge = await getChallengeById(challengeId);
        if (!cancelled) setRow(challenge);
      } catch (err) {
        console.error("[civicx] university mission detail failed", err);
        if (!cancelled) setError("We could not load this mission right now.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  const status = row ? (statusMap[row.status] ?? "SIGNAL DETECTED") : null;
  // Lets CivicX AI answer "explain this mission" about what is on screen.
  useAssistantFocus({ missionId: challengeId, label: row?.title ?? null });

  const hasPoint =
    !!row &&
    typeof row.latitude === "number" &&
    typeof row.longitude === "number" &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude);

  return (
    <>
      <AnimatePresence>
        {challengeId && (
          <div className="fixed inset-0 z-[90] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-background/88 backdrop-blur-md"
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-label="Mission brief"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative mx-auto my-6 w-[min(56rem,calc(100%-1.5rem))]"
            >
              <div className="glass grid-floor relative overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
                <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-azure/20 opacity-40 blur-3xl" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mono-label text-azure/90">MISSION BRIEF</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                      {row?.title ?? (error ? "Mission unavailable" : "Loading mission…")}
                    </h2>
                    {row && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {row.location_name ?? "Location pending"}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close mission brief"
                    className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

                {row && status && (
                  <>
                    <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Cell label="LOCATION" value={row.location_name ?? "—"} />
                      <div className="glass-soft rounded-xl p-4">
                        <p className="mono-label text-muted-foreground">PRIORITY</p>
                        <div className="mt-2.5">
                          <PriorityChip
                            priority={
                              (row.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") ??
                              "MEDIUM"
                            }
                          />
                        </div>
                      </div>
                      <Cell label="CATEGORY" value={categoryLabel(row.category)} />
                      <div className="glass-soft rounded-xl p-4">
                        <p className="mono-label text-muted-foreground">STATUS</p>
                        <div className="mt-3">
                          <StatusChip status={status} />
                        </div>
                      </div>
                    </div>

                    <Block label="AI ANALYSIS">
                      <p className="text-sm leading-relaxed text-foreground/85">
                        {row.ai_summary ?? "AI analysis pending for this signal."}
                      </p>
                    </Block>

                    <Block label="WHY THIS MATTERS">
                      {row.affected_stakeholders && row.affected_stakeholders.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {row.affected_stakeholders.map((s) => (
                            <span
                              key={s}
                              className="rounded-lg border border-violet/30 bg-violet/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-violet"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Affected stakeholders have not been identified yet.
                        </p>
                      )}
                    </Block>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="glass-soft rounded-xl p-4">
                        <p className="mono-label text-muted-foreground">ESTIMATED IMPACT</p>
                        <p className="mt-2.5 flex items-center gap-2 text-sm font-semibold">
                          <Users className="h-4 w-4 text-cyan" />
                          {row.estimated_impact !== null
                            ? `~${row.estimated_impact.toLocaleString("en-IN")} people`
                            : "—"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Reported {formatDate(row.created_at)}
                        </p>
                      </div>
                      <div className="glass-soft rounded-xl p-4">
                        <p className="mono-label text-muted-foreground">RECOMMENDED SKILLS</p>
                        {row.recommended_skills && row.recommended_skills.length > 0 ? (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {row.recommended_skills.map((s) => (
                              <span
                                key={s}
                                className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            No skills recommended yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <Block label="SOLUTION DIRECTIONS">
                      {row.solution_directions && row.solution_directions.length > 0 ? (
                        <ul className="space-y-2">
                          {row.solution_directions.map((d) => (
                            <li key={d} className="flex gap-2.5 text-sm text-foreground/85">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan/80" />
                              <span className="leading-relaxed">{d}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Solution directions will appear after AI analysis.
                        </p>
                      )}
                    </Block>

                    <div className="glass-soft mt-3 overflow-hidden rounded-xl p-4">
                      <p className="mono-label text-muted-foreground">MISSION LOCATION</p>
                      {hasPoint ? (
                        <div className="relative mt-3 h-[18rem] overflow-hidden rounded-xl sm:h-[22rem]">
                          <ClientOnly
                            fallback={
                              <p className="mono-label p-4 text-muted-foreground">
                                LOADING TERRAIN…
                              </p>
                            }
                          >
                            <Suspense
                              fallback={
                                <p className="mono-label p-4 text-muted-foreground">
                                  LOADING TERRAIN…
                                </p>
                              }
                            >
                              <ChallengeMap
                                rows={[row]}
                                arriving={[]}
                                reduced={reduced}
                                onViewMission={() => undefined}
                              />
                            </Suspense>
                          </ClientOnly>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          This challenge has no saved coordinates, so it cannot be mapped.
                        </p>
                      )}
                    </div>

                    <motion.button
                      type="button"
                      onClick={() => setTeamOpen(true)}
                      whileHover={reduced ? {} : { y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background motion-reduce:transform-none sm:w-auto"
                      style={{ backgroundImage: "var(--gradient-accent)" }}
                    >
                      FORM A SOLUTION TEAM
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TeamFormationModal
        open={teamOpen}
        challenge={row}
        onClose={() => setTeamOpen(false)}
        onCreated={onTeamCreated}
        onViewTeam={onViewTeam}
      />
    </>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass-soft mt-3 rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
