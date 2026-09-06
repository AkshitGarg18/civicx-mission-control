import { motion } from "motion/react";
import { ArrowLeft, Lock } from "lucide-react";
import {
  buildLifecycle,
  formatDate,
  formatDateTime,
  type MissionRecord,
} from "@/lib/government-service";
import { LifecycleTrack } from "./LifecycleTrack";

function Block({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-5"
    >
      <p className="mono-label text-muted-foreground">
        <span className="text-violet">{index}</span> · {title}
      </p>
      <div className="mt-4 space-y-3">{children}</div>
    </motion.section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="mono-label text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground/90">{value}</span>
    </div>
  );
}

/**
 * CIVIC MISSION CONTROL — read-only oversight of one mission. Government can
 * see the challenge, the university response, the industry response and the
 * real status history; nothing here can be edited.
 */
export function MissionControlDetail({
  mission,
  onBack,
}: {
  mission: MissionRecord;
  onBack: () => void;
}) {
  const { challenge, team, teamSize, university, proposal, review, collaborations, history } =
    mission;
  const stages = buildLifecycle(mission);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        BACK TO MISSIONS
      </button>

      <header className="space-y-2">
        <p className="mono-label text-muted-foreground">
          CIVIC MISSION CONTROL · MISSION #{challenge.id.slice(0, 4).toUpperCase()}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {challenge.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Read-only oversight. Government cannot modify citizen reports, university
          proposals, AI reviews or industry records.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Block index="01" title="ORIGINAL CHALLENGE">
            <p className="text-sm leading-relaxed text-foreground/90">
              {challenge.description}
            </p>
            <Row label="CATEGORY" value={challenge.category ?? "Uncategorised"} />
            <Row label="PRIORITY" value={challenge.priority} />
            <Row label="LOCATION" value={challenge.location_name ?? "Location pending"} />
            <Row label="REPORTED" value={formatDate(challenge.created_at)} />
            <Row
              label="ESTIMATED IMPACT"
              value={
                challenge.estimated_impact !== null && challenge.estimated_impact !== undefined
                  ? `${challenge.estimated_impact.toLocaleString()} citizens (AI estimate)`
                  : "Not enough data to estimate"
              }
            />
            {challenge.ai_summary ? (
              <>
                <p className="mono-label pt-2 text-muted-foreground">AI SUMMARY</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {challenge.ai_summary}
                </p>
              </>
            ) : (
              <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                NO AI SUMMARY STORED
              </p>
            )}
            <p className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/10 px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              CITIZEN EVIDENCE RESTRICTED — VISIBLE ONLY TO THE REPORTER
            </p>
          </Block>

          <Block index="02" title="UNIVERSITY RESPONSE">
            {team ? (
              <>
                <Row label="TEAM" value={team.team_name} />
                <Row label="UNIVERSITY" value={university?.institution ?? university?.name ?? "—"} />
                <Row label="TEAM SIZE" value={`${teamSize} member${teamSize === 1 ? "" : "s"}`} />
                <Row label="TEAM STATUS" value={team.status.replace(/_/g, " ")} />
                <Row
                  label="SKILL COVERAGE"
                  value={
                    team.skill_coverage !== null && team.skill_coverage !== undefined
                      ? `${team.skill_coverage}%`
                      : "Not recorded"
                  }
                />
                {proposal ? (
                  <>
                    <Row label="PROPOSAL STATUS" value={proposal.status.replace(/_/g, " ")} />
                    <Row
                      label="SUBMITTED"
                      value={proposal.submitted_at ? formatDate(proposal.submitted_at) : "—"}
                    />
                    <Row label="TIMELINE" value={proposal.estimated_timeline || "Not stated"} />
                    <p className="mono-label pt-2 text-muted-foreground">PROPOSED SOLUTION</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {proposal.proposed_solution || "Not stated"}
                    </p>
                    {proposal.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proposal.technologies.map((t) => (
                          <span
                            key={t}
                            className="rounded-lg border border-azure/40 bg-azure/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-azure"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                    NO SUBMITTED PROPOSAL — DRAFTS STAY PRIVATE TO THE TEAM
                  </p>
                )}
              </>
            ) : (
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                NO UNIVERSITY TEAMS ACTIVE
              </p>
            )}
          </Block>

          <Block index="03" title="AI FEASIBILITY REVIEW">
            {review ? (
              <>
                <Row label="TECHNICAL FEASIBILITY" value={review.technical_feasibility} />
                <Row label="IMPACT POTENTIAL" value={review.impact_potential} />
                <Row
                  label="IMPLEMENTATION COMPLEXITY"
                  value={review.implementation_complexity}
                />
                <Row label="SKILL ALIGNMENT" value={review.skill_alignment} />
                <p className="mono-label pt-2 text-muted-foreground">OVERALL ASSESSMENT</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.assessment}
                </p>
                <Row label="RECOMMENDED NEXT STEP" value={review.next_step} />
              </>
            ) : (
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                NO AI REVIEW STORED FOR THIS MISSION
              </p>
            )}
          </Block>

          <Block index="04" title="INDUSTRY RESPONSE">
            {collaborations.length === 0 ? (
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                NO INDUSTRY COLLABORATIONS
              </p>
            ) : (
              collaborations.map(({ row, organization }) => (
                <div key={row.id} className="glass-soft rounded-xl p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {organization?.institution ?? organization?.name ?? "Industry organisation"}
                    </p>
                    <span className="rounded-lg border border-warn/40 bg-warn/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-warn">
                      {row.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    SUPPORT: {row.support_types.length > 0 ? row.support_types.join(" · ") : "—"}
                  </p>
                  {row.next_step && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Next step: {row.next_step}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    RECORDED {formatDate(row.created_at)}
                  </p>
                </div>
              ))
            )}
          </Block>
        </div>

        <div className="space-y-5">
          <Block index="05" title="MISSION LIFECYCLE">
            <LifecycleTrack stages={stages} />
          </Block>

          <Block index="06" title="MISSION TIMELINE">
            {history.length === 0 ? (
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                NO STATUS EVENTS RECORDED
              </p>
            ) : (
              <ol className="space-y-3">
                {history.map((event) => (
                  <li key={event.id} className="border-l border-border/70 pl-3">
                    <p className="font-mono text-[10px] tracking-[0.14em] text-violet">
                      {event.status.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">{event.message}</p>
                    <p className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
                      {formatDateTime(event.created_at)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Block>
        </div>
      </div>
    </div>
  );
}
