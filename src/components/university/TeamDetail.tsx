import { motion } from "motion/react";
import { ArrowLeft, FileText, Users } from "lucide-react";
import { contributionArea, scoreStudent, teamCoverage, type TeamWithMembers } from "@/lib/teams-service";
import type { ChallengeRow } from "@/lib/challenges-service";
import { proposalStatusMeta, type ProposalStatus } from "@/lib/proposal-data";
import { IndustrySignals } from "./IndustrySignals";

/** Team Command Center for one stored team. */
export function TeamDetail({
  entry,
  mission,
  proposalStatus,
  onBack,
  onOpenProposal,
}: {
  entry: TeamWithMembers;
  mission: ChallengeRow | null;
  proposalStatus: string | null;
  onBack: () => void;
  onOpenProposal: () => void;
}) {
  const recommended = mission?.recommended_skills ?? null;
  const members = entry.members.map((m) => ({
    ...m,
    skills: m.profile?.skills ?? [],
  }));
  const coverage = teamCoverage(members, recommended);
  const percent = coverage.percent ?? entry.team.skill_coverage;

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
        BACK TO TEAMS
      </button>

      <div className="glass grid-floor relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet/20 opacity-40 blur-3xl" />
        <p className="mono-label text-violet/90">TEAM COMMAND CENTER</p>
        <h2 className="relative mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {entry.team.team_name}
        </h2>
        <p className="relative mt-2 text-sm text-muted-foreground">
          MISSION · {mission?.title ?? "Mission unavailable"}
        </p>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">TEAM MEMBERS</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-4 w-4 text-cyan" />
              {entry.members.length}
            </p>
          </div>
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">TEAM SKILL COVERAGE</p>
            <p className="mt-2 text-lg font-semibold text-cyan">
              {percent === null ? "—" : `${percent}%`}
            </p>
            {percent !== null && (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundImage: "var(--gradient-accent)" }}
                />
              </div>
            )}
          </div>
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">MISSION STATUS</p>
            <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-signal">
              {entry.team.status.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="relative mt-4 space-y-3">
          <p className="mono-label text-muted-foreground">TEAM MEMBERS</p>
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
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold">
                    {m.profile?.name ?? "Unnamed operator"}
                  </p>
                  {m.is_leader && (
                    <span className="font-mono text-[9px] tracking-[0.14em] text-cyan">
                      TEAM LEADER
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                  {[m.profile?.institution, m.profile?.course, m.profile?.year]
                    .filter(Boolean)
                    .join(" · ") || "Profile details not set"}
                </p>
                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  CONTRIBUTION ·{" "}
                  {m.contribution_area ??
                    contributionArea(scored.matchingSkills, skills)}
                </p>
              </article>
            );
          })}
        </div>

        <div className="glass-soft relative mt-4 overflow-hidden rounded-xl border border-cyan/30 p-4">
          <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan/20 opacity-50 blur-3xl" />
          <p className="mono-label text-muted-foreground">NEXT PHASE</p>
          <p className="relative mt-2 text-sm font-semibold">Solution Proposal</p>
          {proposalStatus ? (
            <p className="relative mt-2 text-sm text-muted-foreground">
              {proposalStatusMeta[proposalStatus as ProposalStatus]?.caption ??
                "Proposal record stored for this team."}
            </p>
          ) : (
            <p className="relative mt-2 text-sm text-muted-foreground">
              Turn this mission brief into a solution blueprint your team can deliver.
            </p>
          )}
          <button
            type="button"
            onClick={onOpenProposal}
            className="relative mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-cyan transition-colors hover:border-cyan/70"
          >
            <FileText className="h-3.5 w-3.5" />
            {proposalStatus ? "OPEN SOLUTION PROPOSAL" : "CREATE SOLUTION PROPOSAL"}
          </button>
          {proposalStatus && (
            <span
              className={`relative ml-3 inline-flex rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${
                proposalStatusMeta[proposalStatus as ProposalStatus]?.tone ??
                "text-muted-foreground border-border bg-muted/20"
              }`}
            >
              {proposalStatusMeta[proposalStatus as ProposalStatus]?.label ??
                proposalStatus.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <IndustrySignals teamId={entry.team.id} />
      </div>
    </motion.section>
  );
}
