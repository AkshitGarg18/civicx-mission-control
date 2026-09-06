import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import type { ChallengeRow } from "@/lib/challenges-service";
import { contributionArea, scoreStudent, teamCoverage, type TeamWithMembers } from "@/lib/teams-service";
import {
  getReview,
  parsePhases,
  proposalStatusLabel,
  type ProposalReviewRow,
  type ProposalRow,
} from "@/lib/proposals-service";
import { reviewProposal } from "@/lib/proposal-review.functions";

const TABS = ["PROPOSAL", "AI REVIEW", "TEAM", "MISSION"] as const;
type Tab = (typeof TABS)[number];

const STEPS = [
  "Reading the original mission analysis",
  "Assessing problem understanding",
  "Assessing the proposed solution",
  "Checking technology and approach",
  "Reviewing the implementation plan",
  "Comparing team skill coverage",
];

function levelTone(level: string): string {
  if (level === "HIGH") return "text-cyan";
  if (level === "MEDIUM") return "text-warn";
  if (level === "LOW") return "text-signal";
  return "text-muted-foreground";
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-[11px] font-semibold tracking-[0.14em] ${levelTone(value)}`}>
        {value}
      </p>
    </div>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>· {i}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Submitted proposal, its AI feasibility review, the real team and the original
 * mission. The review itself is produced server-side; this screen only reads it.
 */
export function ProposalView({
  entry,
  mission,
  proposal,
  autoReview,
  onBack,
  onStatusChange,
}: {
  entry: TeamWithMembers;
  mission: ChallengeRow | null;
  proposal: ProposalRow;
  autoReview: boolean;
  onBack: () => void;
  onStatusChange: (status: string) => void;
}) {
  const [tab, setTab] = useState<Tab>(autoReview ? "AI REVIEW" : "PROPOSAL");
  const [review, setReview] = useState<ProposalReviewRow | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const runReview = useServerFn(reviewProposal);

  const recommended = mission?.recommended_skills ?? null;
  const coverage = teamCoverage(
    entry.members.map((m) => ({ skills: m.profile?.skills ?? [] })),
    recommended,
  );
  const percent = coverage.percent ?? entry.team.skill_coverage;
  const phases = parsePhases(proposal.implementation_plan);

  const startReview = useCallback(async () => {
    setAnalysing(true);
    setFailed(false);
    onStatusChange("UNDER_AI_REVIEW");
    try {
      await runReview({ data: { proposalId: proposal.id } });
      setReview(await getReview(proposal.id));
      onStatusChange("AI_REVIEW_COMPLETE");
    } catch (err) {
      console.error("[civicx] proposal AI review failed", err);
      setFailed(true);
      onStatusChange("AI_REVIEW_FAILED");
    } finally {
      setAnalysing(false);
    }
  }, [onStatusChange, proposal.id, runReview]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const existing = await getReview(proposal.id);
        if (cancelled) return;
        setReview(existing);
        setLoaded(true);
        if (!existing && (autoReview || proposal.status === "SUBMITTED")) {
          await startReview();
        }
      } catch (err) {
        console.error("[civicx] loading proposal review failed", err);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.id]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        BACK TO TEAM
      </button>

      <div className="glass grid-floor relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/20 opacity-40 blur-3xl" />
        <p className="mono-label text-cyan/90">SOLUTION PROPOSAL</p>
        <h2 className="relative mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {mission?.title ?? "Mission unavailable"}
        </h2>
        <p className="relative mt-2 font-mono text-[10px] tracking-[0.14em] text-signal">
          STATUS · {proposalStatusLabel[proposal.status] ?? proposal.status}
        </p>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-xl border px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] transition-colors ${
                tab === t
                  ? "border-cyan/60 bg-cyan/10 text-cyan"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "PROPOSAL" && (
        <div className="space-y-3">
          {[
            { label: "PROBLEM UNDERSTANDING", value: proposal.problem_understanding },
            { label: "PROPOSED SOLUTION", value: proposal.proposed_solution },
            { label: "EXPECTED IMPACT", value: proposal.expected_impact },
          ].map((s) => (
            <div key={s.label} className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">{s.label}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{s.value}</p>
            </div>
          ))}

          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">TECHNOLOGY & APPROACH</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(proposal.technologies ?? []).map((t) => (
                <span
                  key={t}
                  className="rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">IMPLEMENTATION PLAN</p>
            <div className="mt-3 space-y-3">
              {phases.map((p, i) => (
                <div key={i} className="rounded-xl border border-border p-3.5">
                  <p className="mono-label text-cyan/90">PHASE {i + 1}</p>
                  <p className="mt-1.5 text-sm font-medium">{p.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  {p.duration && (
                    <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                      {p.duration}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">TIMELINE</p>
              <p className="mt-1.5 text-sm font-medium">
                {proposal.estimated_timeline || "—"}
              </p>
            </div>
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">RESOURCES REQUIRED</p>
              <p className="mt-1.5 text-sm">
                {(proposal.resources_required ?? []).join(" · ") || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "AI REVIEW" && (
        <div className="space-y-3">
          {analysing && (
            <div className="glass grid-floor rounded-2xl p-6">
              <p className="mono-label text-cyan/90">ANALYZING SOLUTION…</p>
              <div className="mt-4 space-y-2">
                {STEPS.map((s, i) => (
                  <motion.p
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 * i, duration: 0.3 }}
                    className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground"
                  >
                    ● {s}
                  </motion.p>
                ))}
              </div>
            </div>
          )}

          {!analysing && failed && (
            <div className="glass-soft rounded-xl border border-warn/40 p-5">
              <p className="mono-label text-warn">AI REVIEW UNAVAILABLE</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your proposal is saved and submitted, but the feasibility review could not
                be completed. You can retry.
              </p>
              <button
                type="button"
                onClick={() => void startReview()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan/50 bg-cyan/10 px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-cyan transition-colors hover:border-cyan"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                RETRY REVIEW
              </button>
            </div>
          )}

          {!analysing && !failed && !review && loaded && (
            <div className="glass-soft rounded-xl p-5">
              <p className="mono-label text-muted-foreground">NO AI REVIEW YET</p>
              <button
                type="button"
                onClick={() => void startReview()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan/50 bg-cyan/10 px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-cyan transition-colors hover:border-cyan"
              >
                START AI FEASIBILITY REVIEW
              </button>
            </div>
          )}

          {!analysing && review && (
            <>
              <div className="glass grid-floor rounded-2xl p-5">
                <p className="mono-label text-cyan/90">CIVICX AI FEASIBILITY REVIEW</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Indicator label="TECHNICAL FEASIBILITY" value={review.technical_feasibility} />
                  <Indicator label="IMPACT POTENTIAL" value={review.impact_potential} />
                  <Indicator
                    label="IMPLEMENTATION COMPLEXITY"
                    value={review.implementation_complexity}
                  />
                  <Indicator label="SKILL ALIGNMENT" value={review.skill_alignment} />
                </div>
              </div>

              <div className="glass-soft rounded-xl p-4">
                <p className="mono-label text-muted-foreground">AI ASSESSMENT</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {review.assessment}
                </p>
              </div>

              <List label="STRENGTHS" items={review.strengths ?? []} />
              <List label="RISKS & CONCERNS" items={review.risks ?? []} />
              <List label="RECOMMENDATIONS" items={review.recommendations ?? []} />

              <div className="glass-soft rounded-xl border border-border p-4">
                <p className="mono-label text-muted-foreground">NEXT STEP</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-cyan" />
                  {review.next_step}
                </p>
                {review.next_step === "READY FOR INDUSTRY REVIEW" && (
                  <p className="mono-label mt-3 text-cyan">INDUSTRY REVIEW READY</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "TEAM" && (
        <div className="space-y-3">
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">TEAM</p>
            <p className="mt-1.5 text-sm font-semibold">{entry.team.team_name}</p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-cyan">
              SKILL COVERAGE · {percent === null ? "—" : `${percent}%`}
            </p>
          </div>
          {entry.members.map((m) => {
            const skills = m.profile?.skills ?? [];
            const scored = scoreStudent(
              {
                id: m.user_id,
                name: m.profile?.name ?? null,
                institution: m.profile?.institution ?? null,
                course: m.profile?.course ?? null,
                year: m.profile?.year ?? null,
                skills,
              },
              recommended,
            );
            return (
              <article key={m.id} className="glass-soft rounded-xl p-4">
                <p className="text-sm font-semibold">
                  {m.profile?.name ?? "Unnamed operator"}
                  {m.is_leader && (
                    <span className="ml-3 font-mono text-[9px] tracking-[0.14em] text-cyan">
                      TEAM LEADER
                    </span>
                  )}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                  {[m.profile?.institution, m.profile?.course, m.profile?.year]
                    .filter(Boolean)
                    .join(" · ") || "Profile details not set"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  CONTRIBUTION ·{" "}
                  {m.contribution_area ?? contributionArea(scored.matchingSkills, skills)}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {tab === "MISSION" && (
        <div className="space-y-3">
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">MISSION BRIEF</p>
            <p className="mt-1.5 text-sm font-semibold">{mission?.title ?? "—"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {[mission?.category, mission?.location_name, mission?.priority]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {mission?.ai_summary && (
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">AI ANALYSIS</p>
              <p className="mt-2 text-sm leading-relaxed">{mission.ai_summary}</p>
            </div>
          )}
          <List label="AFFECTED STAKEHOLDERS" items={mission?.affected_stakeholders ?? []} />
          <List label="SOLUTION DIRECTIONS" items={mission?.solution_directions ?? []} />
          <List label="AI RECOMMENDED SKILLS" items={recommended ?? []} />
        </div>
      )}
    </motion.section>
  );
}
