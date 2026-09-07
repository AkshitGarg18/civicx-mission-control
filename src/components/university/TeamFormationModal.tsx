import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Check, MapPin, Minus, Plus, Radar, Users, X } from "lucide-react";
import { PriorityChip } from "@/components/civicx/StatusChip";
import type { ChallengeRow } from "@/lib/challenges-service";
import { categoryLabel } from "@/lib/university-data";
import { useAuth } from "@/lib/auth-context";
import {
  MAX_TEAM_SIZE,
  MIN_TEAM_SIZE,
  contributionArea,
  createMissionTeam,
  getDiscoverableStudents,
  scoreStudent,
  teamCoverage,
  type StudentMatch,
} from "@/lib/teams-service";

type Phase = "matching" | "build" | "confirm" | "success";

/** True when a student's own skill label satisfies one of the matched needs. */
function isMatchingSkill(skill: string, matching: string[]): boolean {
  const x = skill.trim().toLowerCase();
  return matching.some((m) => {
    const y = m.trim().toLowerCase();
    return x === y || x.includes(y) || y.includes(x);
  });
}

function SkillChip({ label, tone = "cyan" }: { label: string; tone?: "cyan" | "violet" }) {

  return (
    <span
      className={
        tone === "cyan"
          ? "rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
          : "rounded-lg border border-violet/30 bg-violet/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-violet"
      }
    >
      {label}
    </span>
  );
}

function CoverageBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ backgroundImage: "var(--gradient-accent)" }}
      />
    </div>
  );
}

/**
 * Real team formation: skill matching over stored university profiles, a team
 * builder with live coverage, and persistence into `teams` / `team_members`.
 */
export function TeamFormationModal({
  open,
  challenge,
  onClose,
  onCreated,
  onViewTeam,
}: {
  open: boolean;
  challenge: ChallengeRow | null;
  onClose: () => void;
  onCreated?: (() => void) | undefined;
  onViewTeam?: ((teamId: string) => void) | undefined;
}) {
  const reduced = useReducedMotion() ?? false;
  const { currentProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>("matching");
  const [students, setStudents] = useState<StudentMatch[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  const [skillFilter, setSkillFilter] = useState<string | null>(null);


  const recommended = challenge?.recommended_skills ?? null;
  const hasRecommended = (recommended ?? []).length > 0;
  const skillProfileIncomplete = (currentProfile?.skills ?? []).length === 0;

  /* Load discoverable profiles and score them each time the modal opens. */
  useEffect(() => {
    if (!open || !challenge) return;
    let cancelled = false;
    setPhase("matching");
    setSelected(currentProfile ? [currentProfile.id] : []);
    setTeamName("");
    setSaveError(null);
    setLoadError(null);
    setCreatedTeamId(null);
    setSkillFilter(null);


    void (async () => {
      const started = Date.now();
      try {
        const profiles = await getDiscoverableStudents();
        const scored = profiles
          .map((p) => scoreStudent(p, recommended))
          .sort((a, b) => (b.matchPercent ?? -1) - (a.matchPercent ?? -1));
        if (cancelled) return;
        setStudents(scored);
      } catch (err) {
        console.error("[civicx] student discovery failed", err);
        if (!cancelled) setLoadError("We could not load university profiles right now.");
      } finally {
        const wait = reduced ? 0 : Math.max(0, 900 - (Date.now() - started));
        setTimeout(() => {
          if (!cancelled) setPhase("build");
        }, wait);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, challenge?.id]);

  const selectedMembers = useMemo(
    () => students.filter((s) => selected.includes(s.id)),
    [students, selected],
  );
  const coverage = useMemo(
    () => teamCoverage(selectedMembers, recommended),
    [selectedMembers, recommended],
  );

  /**
   * Students shown in the list. With a skill gap filter active, only students
   * whose own saved skills cover that missing skill are shown.
   */
  const visibleStudents = useMemo(() => {
    if (!skillFilter) return students;
    return students.filter((s) => isMatchingSkill(skillFilter, s.skills));
  }, [students, skillFilter]);


  const toggle = (id: string) => {
    setSaveError(null);
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (id === currentProfile?.id) return prev; // leader stays
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_TEAM_SIZE) return prev;
      return [...prev, id];
    });
  };

  const create = async () => {
    if (!challenge || !currentProfile) return;
    const name = teamName.trim();
    if (name.length < 2) {
      setSaveError("Give your team a name of at least 2 characters.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const team = await createMissionTeam({
        missionId: challenge.id,
        teamName: name,
        leaderId: currentProfile.id,
        skillCoverage: coverage.percent,
        members: selectedMembers.map((m) => ({
          userId: m.id,
          contributionArea: contributionArea(m.matchingSkills, m.skills),
        })),
      });
      setCreatedTeamId(team.id);
      setPhase("success");
      onCreated?.();
    } catch (err) {
      console.error("[civicx] team creation failed", err);
      setSaveError("The team could not be created. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !challenge) return null;

  const canCreate =
    selected.length >= MIN_TEAM_SIZE && selected.length <= MAX_TEAM_SIZE;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/90 backdrop-blur-md"
        />
        <motion.div
          role="dialog"
          aria-label="Mission team formation"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto my-6 w-[min(62rem,calc(100%-1.5rem))]"
        >
          <div className="glass grid-floor relative overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
            <span className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet/20 opacity-40 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mono-label text-violet/90">MISSION TEAM FORMATION</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Assemble the right multidisciplinary team for this civic mission.
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close team formation"
                className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mission header */}
            <div className="glass-soft relative mt-6 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-3">
                <PriorityChip
                  priority={
                    (challenge.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") ??
                    "MEDIUM"
                  }
                />
                <span className="font-mono text-[10px] tracking-[0.14em] text-azure">
                  {categoryLabel(challenge.category).toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {challenge.location_name ?? "Location pending"}
                </span>
              </div>
              <h3 className="mt-2.5 text-base font-semibold sm:text-lg">
                {challenge.title}
              </h3>
            </div>

            {phase === "matching" && (
              <div className="relative py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan/40 bg-cyan/10 text-cyan">
                  <Radar className="h-6 w-6 motion-safe:animate-pulse" strokeWidth={1.5} />
                </span>
                <p className="mono-label mt-6 text-cyan">ASSEMBLING SOLUTION UNIT…</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Comparing mission skills against university skill profiles.
                </p>
              </div>
            )}

            {phase === "build" && (
              <>
                {/* AI recommended skills */}
                <div className="glass-soft relative mt-3 rounded-xl p-4">
                  <p className="mono-label text-muted-foreground">AI RECOMMENDED SKILLS</p>
                  {hasRecommended ? (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {recommended!.map((s) => (
                        <SkillChip key={s} label={s.toUpperCase()} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-violet">
                      MATCHING UNAVAILABLE
                    </p>
                  )}
                </div>

                {skillProfileIncomplete && (
                  <div className="glass-soft relative mt-3 rounded-xl border border-violet/30 p-4">
                    <p className="mono-label text-violet">SKILL PROFILE INCOMPLETE</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Add your own skills so your contribution area can be matched to
                      this mission.
                    </p>
                    <Link
                      to="/profile"
                      className="mt-3 inline-flex rounded-xl border border-violet/40 bg-violet/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-violet"
                    >
                      COMPLETE PROFILE
                    </Link>
                  </div>
                )}

                <div className="relative mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  {/* Top matches */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="mono-label text-muted-foreground">
                        {skillFilter ? `STUDENTS WITH ${skillFilter.toUpperCase()}` : "TOP MATCHES"}
                      </p>
                      {skillFilter && (
                        <button
                          type="button"
                          onClick={() => setSkillFilter(null)}
                          className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          CLEAR FILTER
                        </button>
                      )}
                    </div>
                    {loadError && (
                      <p className="mt-3 text-sm text-destructive">{loadError}</p>
                    )}
                    {!loadError && visibleStudents.length === 0 && (
                      <div className="glass-soft mt-3 rounded-xl px-5 py-10 text-center">
                        <p className="mono-label text-muted-foreground">
                          NO MATCHING STUDENTS FOUND
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {skillFilter
                            ? "No university student has saved this skill yet."
                            : "Invite students to complete their CivicX skill profiles."}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 space-y-3">
                      {visibleStudents.map((s) => {

                        const inTeam = selected.includes(s.id);
                        const isSelf = s.id === currentProfile?.id;
                        return (
                          <article
                            key={s.id}
                            className="glass-soft rounded-xl p-4 transition-colors hover:border-azure/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {(s.name ?? "Unnamed operator").toUpperCase()}
                                  {isSelf && (
                                    <span className="ml-2 font-mono text-[9px] tracking-[0.14em] text-cyan">
                                      YOU
                                    </span>
                                  )}
                                </p>
                                <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                                  {[s.institution, s.course, s.year]
                                    .filter(Boolean)
                                    .join(" · ") || "Profile details not set"}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="mono-label text-muted-foreground">AI MATCH</p>
                                <p className="text-lg font-semibold text-cyan">
                                  {s.matchPercent === null ? "—" : `${s.matchPercent}%`}
                                </p>
                              </div>
                            </div>

                            {s.skills.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {s.skills.map((k) => {
                                  const hit = isMatchingSkill(k, s.matchingSkills);
                                  return (
                                    <span
                                      key={k}
                                      className={
                                        hit
                                          ? "inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                                          : "rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground"
                                      }
                                    >
                                      {k}
                                      {hit && <Check className="h-3 w-3" />}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-violet">
                                SKILL PROFILE INCOMPLETE
                              </p>
                            )}

                            {s.bio && (
                              <p className="mt-3 text-xs text-muted-foreground">{s.bio}</p>
                            )}


                            {s.matchingSkills.length > 0 && (
                              <div className="mt-3">
                                <p className="mono-label text-muted-foreground">
                                  MATCHING SKILLS
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {s.matchingSkills.map((k) => (
                                    <SkillChip key={k} label={k} />
                                  ))}
                                </div>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => toggle(s.id)}
                              disabled={
                                (isSelf && inTeam) ||
                                (!inTeam && selected.length >= MAX_TEAM_SIZE)
                              }
                              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-azure/40 bg-azure/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-azure transition-colors hover:border-azure/70 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {inTeam ? (
                                <>
                                  <Minus className="h-3.5 w-3.5" /> REMOVE
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" /> ADD TO TEAM
                                </>
                              )}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current team + coverage */}
                  <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
                    <div className="glass-soft rounded-xl p-4">
                      <p className="mono-label text-muted-foreground">
                        CURRENT TEAM · {selected.length}/{MAX_TEAM_SIZE}
                      </p>
                      {selectedMembers.length === 0 ? (
                        <p className="mt-2.5 text-sm text-muted-foreground">
                          No members selected yet.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-3">
                          {selectedMembers.map((m) => (
                            <li key={m.id} className="border-t border-border pt-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {m.name ?? "Unnamed operator"}
                                    {m.id === currentProfile?.id && (
                                      <span className="ml-2 font-mono text-[9px] tracking-[0.14em] text-cyan">
                                        TEAM LEADER
                                      </span>
                                    )}
                                  </p>
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {contributionArea(m.matchingSkills, m.skills)}
                                  </p>
                                </div>
                                {m.id !== currentProfile?.id && (
                                  <button
                                    type="button"
                                    onClick={() => toggle(m.id)}
                                    className="shrink-0 font-mono text-[9px] tracking-[0.14em] text-muted-foreground transition-colors hover:text-destructive"
                                  >
                                    REMOVE
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="glass-soft rounded-xl p-4">
                      <p className="mono-label text-muted-foreground">TEAM COVERAGE</p>
                      {coverage.percent === null ? (
                        <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-violet">
                          MATCHING UNAVAILABLE
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 text-2xl font-semibold text-cyan">
                            {coverage.percent}%
                          </p>
                          <CoverageBar percent={coverage.percent} />
                          <ul className="mt-4 space-y-2">
                            {coverage.items.map((i) => (
                              <li
                                key={i.skill}
                                className="flex items-center gap-2 text-sm text-foreground/85"
                              >
                                {i.covered ? (
                                  <Check className="h-3.5 w-3.5 text-cyan" />
                                ) : (
                                  <X className="h-3.5 w-3.5 text-destructive" />
                                )}
                                {i.skill}
                              </li>
                            ))}
                          </ul>
                          {coverage.missing.length > 0 ? (
                            <div className="mt-4 rounded-xl border border-warn/30 bg-warn/5 p-3">
                              <p className="mono-label text-warn">SKILL GAP DETECTED</p>
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                Your team is missing: {coverage.missing.join(", ")}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {coverage.missing.map((skill) => (
                                  <button
                                    key={skill}
                                    type="button"
                                    onClick={() =>
                                      setSkillFilter(skillFilter === skill ? null : skill)
                                    }
                                    className={
                                      skillFilter === skill
                                        ? "rounded-xl border border-warn/60 bg-warn/15 px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[0.14em] text-warn"
                                        : "rounded-xl border border-border px-3 py-1.5 font-mono text-[9px] tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
                                    }
                                  >
                                    {skillFilter === skill ? "SHOWING · " : "FIND A STUDENT WITH · "}
                                    {skill.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="mono-label mt-4 text-signal">MISSION READY</p>
                          )}

                        </>
                      )}
                    </div>

                    <div className="glass-soft rounded-xl p-4">
                      {!canCreate && (
                        <p className="mono-label text-warn">
                          {selected.length < MIN_TEAM_SIZE
                            ? "ADD AT LEAST ONE MORE MEMBER"
                            : "TEAM LIMIT REACHED"}
                        </p>
                      )}
                      <motion.button
                        type="button"
                        onClick={() => setPhase("confirm")}
                        disabled={!canCreate}
                        whileHover={reduced || !canCreate ? {} : { y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-background disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transform-none"
                        style={{ backgroundImage: "var(--gradient-accent)" }}
                      >
                        CONTINUE TO TEAM REVIEW
                      </motion.button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {phase === "confirm" && (
              <div className="relative mt-4">
                <p className="mono-label text-cyan">MISSION TEAM READY</p>
                <div className="glass-soft mt-3 rounded-xl p-5">
                  <label
                    htmlFor="team-name"
                    className="mono-label text-muted-foreground"
                  >
                    TEAM NAME
                  </label>
                  <input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="CivicPulse"
                    maxLength={60}
                    className="mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-cyan/60"
                  />

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="mono-label text-muted-foreground">MISSION</p>
                      <p className="mt-1.5 text-sm">{challenge.title}</p>
                    </div>
                    <div>
                      <p className="mono-label text-muted-foreground">TEAM MEMBERS</p>
                      <p className="mt-1.5 text-sm">{selected.length}</p>
                    </div>
                    <div>
                      <p className="mono-label text-muted-foreground">SKILL COVERAGE</p>
                      <p className="mt-1.5 text-sm">
                        {coverage.percent === null ? "—" : `${coverage.percent}%`}
                      </p>
                    </div>
                    <div>
                      <p className="mono-label text-muted-foreground">MISSION STATUS</p>
                      <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-cyan">
                        TEAM FORMING
                      </p>
                    </div>
                  </div>

                  {saveError && (
                    <p className="mt-4 text-sm text-destructive">{saveError}</p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <motion.button
                      type="button"
                      onClick={create}
                      disabled={saving}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background disabled:opacity-50"
                      style={{ backgroundImage: "var(--gradient-accent)" }}
                    >
                      {saving ? "CREATING…" : "CREATE MISSION TEAM"}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setPhase("build")}
                      className="rounded-xl border border-border px-5 py-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      BACK TO TEAM BUILDER
                    </button>
                  </div>
                </div>
              </div>
            )}

            {phase === "success" && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative py-10 text-center"
              >
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-signal/40 bg-signal/10 text-signal">
                  <Users className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <p className="mono-label mt-6 text-signal">MISSION TEAM FORMED</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your team is now assigned to this civic mission.
                </p>

                <div className="glass-soft mx-auto mt-6 grid max-w-2xl gap-3 rounded-xl p-5 text-left sm:grid-cols-2">
                  <div>
                    <p className="mono-label text-muted-foreground">TEAM NAME</p>
                    <p className="mt-1.5 text-sm">{teamName.trim()}</p>
                  </div>
                  <div>
                    <p className="mono-label text-muted-foreground">MISSION</p>
                    <p className="mt-1.5 text-sm">{challenge.title}</p>
                  </div>
                  <div>
                    <p className="mono-label text-muted-foreground">MEMBERS</p>
                    <p className="mt-1.5 text-sm">{selected.length}</p>
                  </div>
                  <div>
                    <p className="mono-label text-muted-foreground">SKILL COVERAGE</p>
                    <p className="mt-1.5 text-sm">
                      {coverage.percent === null ? "—" : `${coverage.percent}%`}
                    </p>
                  </div>
                  <div>
                    <p className="mono-label text-muted-foreground">MISSION STATUS</p>
                    <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-signal">
                      TEAM FORMED
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (createdTeamId) onViewTeam?.(createdTeamId);
                      onClose();
                    }}
                    className="rounded-xl px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background"
                    style={{ backgroundImage: "var(--gradient-accent)" }}
                  >
                    VIEW TEAM
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-border px-5 py-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    BACK TO MISSION
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
