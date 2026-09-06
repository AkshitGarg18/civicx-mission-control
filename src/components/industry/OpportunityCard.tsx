import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, MapPin, Sparkles, Users } from "lucide-react";
import { PriorityChip } from "@/components/civicx/StatusChip";
import { categoryLabel } from "@/lib/university-data";
import {
  collaborationStatusMeta,
  feasibilityTone,
  type CollaborationStatus,
} from "@/lib/industry-data";
import { matchScore, type Opportunity, type ProfileRow } from "@/lib/industry-service";

/** One reviewed university solution, presented as an acceleration opportunity. */
export function OpportunityCard({
  opportunity,
  profile,
  onView,
}: {
  opportunity: Opportunity;
  profile: ProfileRow | null;
  onView: (proposalId: string) => void;
}) {
  const reduced = useReducedMotion();
  const { proposal, review, mission, team, university, mine, interestCount } = opportunity;
  const priority = (mission?.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") ?? "MEDIUM";
  const match = matchScore(opportunity, profile);
  const mineMeta = mine
    ? collaborationStatusMeta[mine.status as CollaborationStatus]
    : null;

  return (
    <motion.article
      whileHover={reduced ? {} : { y: -6 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass border-flow group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 motion-reduce:transform-none"
    >
      <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-warn/20 opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />

      <div className="relative flex items-start justify-between gap-3">
        <PriorityChip priority={priority} />
        <span className="font-mono text-[10px] tracking-[0.16em] text-warn">
          AI REVIEW COMPLETE
        </span>
      </div>

      <h3 className="relative mt-4 text-base font-semibold leading-snug tracking-tight sm:text-lg">
        {mission?.title ?? "Mission unavailable"}
      </h3>

      <p className="relative mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
        <span className="text-azure">
          {categoryLabel(mission?.category ?? null).toUpperCase()}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {mission?.location_name ?? "Location pending"}
        </span>
      </p>

      <div className="glass-soft relative mt-4 rounded-xl p-3.5">
        <p className="mono-label text-muted-foreground">PROPOSED SOLUTION</p>
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground/85">
          {proposal.proposed_solution || "No solution summary recorded."}
        </p>
      </div>

      <div className="relative mt-3 grid gap-3 sm:grid-cols-2">
        <div className="glass-soft rounded-xl p-3.5">
          <p className="mono-label text-muted-foreground">AI FEASIBILITY</p>
          <p
            className={`mt-2 font-mono text-[11px] tracking-[0.14em] ${
              feasibilityTone[review.technical_feasibility] ?? "text-muted-foreground"
            }`}
          >
            {review.technical_feasibility}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Impact potential {review.impact_potential.toLowerCase()} · complexity{" "}
            {review.implementation_complexity.toLowerCase()}
          </p>
        </div>
        <div className="glass-soft rounded-xl p-3.5">
          <p className="mono-label text-muted-foreground">CAPABILITY MATCH</p>
          {match ? (
            <>
              <p className="mt-2 font-mono text-[11px] tracking-[0.14em] text-cyan">
                {match.percent}% OVERLAP
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {match.overlap.length > 0
                  ? match.overlap.slice(0, 4).join(" · ")
                  : "No overlap with your listed capabilities yet."}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-violet">
                PROFILE REQUIRED
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Add your expertise and technologies to see capability matching.
              </p>
            </>
          )}
        </div>
      </div>

      {(proposal.technologies ?? []).length > 0 && (
        <div className="relative mt-3">
          <p className="mono-label text-muted-foreground">TECHNOLOGIES</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(proposal.technologies ?? []).slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-soft relative mt-3 rounded-xl p-3.5">
        <p className="mono-label text-muted-foreground">SOLUTION TEAM</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Users className="h-3.5 w-3.5 text-violet" />
          {team?.team_name ?? "Team unavailable"}
        </p>
        <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
          {university?.institution ?? university?.name ?? "University details not shared"}
        </p>
      </div>

      {mineMeta && (
        <p
          className={`relative mt-3 inline-flex w-fit items-center gap-2 rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${mineMeta.tone}`}
        >
          <Sparkles className="h-3 w-3" />
          {mineMeta.label}
        </p>
      )}

      <div className="relative mt-5 flex items-center justify-between gap-3 pt-1">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          {interestCount === 0
            ? "NO INDUSTRY INTEREST YET"
            : `${interestCount} INDUSTRY SIGNAL${interestCount === 1 ? "" : "S"}`}
        </span>
        <motion.button
          type="button"
          onClick={() => onView(proposal.id)}
          whileHover={reduced ? {} : { x: 3 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-xl border border-warn/40 bg-warn/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-warn transition-colors hover:border-warn/70 motion-reduce:transform-none"
        >
          VIEW SOLUTION
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.article>
  );
}
