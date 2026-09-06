import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Handshake,
  MapPin,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { PriorityChip } from "@/components/civicx/StatusChip";
import { categoryLabel } from "@/lib/university-data";
import {
  collaborationStatusMeta,
  feasibilityTone,
  type CollaborationStatus,
} from "@/lib/industry-data";
import { matchScore, type Opportunity, type ProfileRow } from "@/lib/industry-service";

/** Renders whatever shape the stored implementation plan happens to have. */
function planSteps(plan: unknown): string[] {
  if (!Array.isArray(plan)) return [];
  return plan.map((step) => {
    if (typeof step === "string") return step;
    if (step && typeof step === "object") {
      const s = step as Record<string, unknown>;
      const parts = [s["phase"], s["title"], s["duration"], s["description"]]
        .filter((v) => typeof v === "string" && v.trim())
        .join(" — ");
      if (parts) return parts;
    }
    return String(step);
  });
}

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

function Tags({ items, tone }: { items: string[]; tone: string }) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Not specified.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span
          key={i}
          className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] ${tone}`}
        >
          {i}
        </span>
      ))}
    </div>
  );
}

/** Full evaluation screen for one reviewed solution. */
export function OpportunityDetail({
  opportunity,
  profile,
  onBack,
  onExpressInterest,
}: {
  opportunity: Opportunity;
  profile: ProfileRow | null;
  onBack: () => void;
  onExpressInterest: () => void;
}) {
  const { proposal, review, mission, team, university, mine } = opportunity;
  const match = matchScore(opportunity, profile);
  const mineMeta = mine
    ? collaborationStatusMeta[mine.status as CollaborationStatus]
    : null;
  const steps = planSteps(proposal.implementation_plan);

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
        BACK TO OPPORTUNITIES
      </button>

      <div className="glass grid-floor relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-warn/20 opacity-40 blur-3xl" />

        <div className="relative flex flex-wrap items-center gap-3">
          <PriorityChip
            priority={(mission?.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") ?? "MEDIUM"}
          />
          <span className="font-mono text-[10px] tracking-[0.16em] text-warn">
            AI REVIEW COMPLETE
          </span>
        </div>

        <h2 className="relative mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          {mission?.title ?? "Mission unavailable"}
        </h2>
        <p className="relative mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          <span className="text-azure">
            {categoryLabel(mission?.category ?? null).toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {mission?.location_name ?? "Location pending"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {mission?.estimated_impact !== null && mission?.estimated_impact !== undefined
              ? `~${mission.estimated_impact.toLocaleString("en-IN")} people affected`
              : "Impact estimate pending"}
          </span>
        </p>

        <div className="relative mt-6 grid gap-3 lg:grid-cols-2">
          <Block label="CIVIC PROBLEM">
            {mission?.description ?? "Challenge description unavailable."}
          </Block>
          <Block label="TEAM UNDERSTANDING OF THE PROBLEM">
            {proposal.problem_understanding || "Not recorded."}
          </Block>
          <Block label="PROPOSED SOLUTION">
            {proposal.proposed_solution || "Not recorded."}
          </Block>
          <Block label="EXPECTED IMPACT">
            {proposal.expected_impact || "Not recorded."}
          </Block>
          <Block label="TECHNOLOGIES">
            <Tags
              items={proposal.technologies ?? []}
              tone="border-cyan/30 bg-cyan/5 text-cyan"
            />
          </Block>
          <Block label="RESOURCES THE TEAM NEEDS">
            <Tags
              items={proposal.resources_required ?? []}
              tone="border-warn/30 bg-warn/5 text-warn"
            />
          </Block>
        </div>

        <div className="relative mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["TECHNICAL FEASIBILITY", review.technical_feasibility],
            ["IMPACT POTENTIAL", review.impact_potential],
            ["IMPLEMENTATION COMPLEXITY", review.implementation_complexity],
            ["SKILL ALIGNMENT", review.skill_alignment],
          ].map(([label, value]) => (
            <div key={label} className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">{label}</p>
              <p
                className={`mt-2 font-mono text-[11px] tracking-[0.14em] ${
                  feasibilityTone[value!] ?? "text-foreground"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-3 grid gap-3 lg:grid-cols-3">
          <Block label="AI ASSESSMENT">{review.assessment}</Block>
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-signal">STRENGTHS</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground/85">
              {(review.strengths ?? []).map((s) => (
                <li key={s} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-warn">RISKS</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground/85">
              {(review.risks ?? []).map((r) => (
                <li key={r} className="flex gap-2">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {steps.length > 0 && (
          <div className="glass-soft relative mt-3 rounded-xl p-4">
            <p className="mono-label text-muted-foreground">IMPLEMENTATION PLAN</p>
            <ol className="mt-3 space-y-2">
              {steps.map((step, i) => (
                <li key={`${i}-${step}`} className="flex gap-3 text-sm text-foreground/85">
                  <span className="mono-label shrink-0 text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            {proposal.estimated_timeline && (
              <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                TIMELINE · {proposal.estimated_timeline.toUpperCase()}
              </p>
            )}
          </div>
        )}

        <div className="relative mt-3 grid gap-3 lg:grid-cols-2">
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">SOLUTION TEAM</p>
            <p className="mt-2 text-sm font-semibold">
              {team?.team_name ?? "Team unavailable"}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
              {university?.institution ?? university?.name ?? "University details not shared"}
            </p>
            {team?.skill_coverage !== null && team?.skill_coverage !== undefined && (
              <p className="mt-2 text-sm text-cyan">
                Team skill coverage {team.skill_coverage}%
              </p>
            )}
          </div>
          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">CAPABILITY MATCH</p>
            {match ? (
              <>
                <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-cyan">
                  {match.percent}% OVERLAP WITH YOUR CAPABILITIES
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {match.overlap.length > 0
                    ? match.overlap.join(" · ")
                    : "None of your listed capabilities overlap with this solution yet."}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Add your expertise and technologies in Organization Profile to see how well
                this solution matches what you can offer.
              </p>
            )}
          </div>
        </div>

        <div className="glass-soft relative mt-3 rounded-xl border border-border p-4">
          <p className="mono-label text-muted-foreground">AI RECOMMENDED NEXT STEP</p>
          <p className="mt-2 text-sm text-foreground/85">{review.next_step}</p>
        </div>

        {mineMeta ? (
          <div
            className={`relative mt-5 rounded-xl border p-4 ${mineMeta.tone}`}
          >
            <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.16em]">
              <Sparkles className="h-3.5 w-3.5" />
              {mineMeta.label}
            </p>
            <p className="mt-2 text-sm text-foreground/85">{mineMeta.caption}</p>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={onExpressInterest}
            whileTap={{ scale: 0.98 }}
            className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-warn transition-colors hover:border-warn/80"
          >
            <Handshake className="h-4 w-4" />
            EXPRESS INTEREST IN THIS SOLUTION
          </motion.button>
        )}
      </div>
    </motion.section>
  );
}
