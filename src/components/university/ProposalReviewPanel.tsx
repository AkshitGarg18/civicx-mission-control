import { motion } from "motion/react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Radio,
  Sparkles,
} from "lucide-react";
import { complexityTone, ratingTone } from "@/lib/proposal-data";
import type { ProposalReviewRow } from "@/lib/proposals-service";

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-sm tracking-[0.14em] ${tone}`}>{value}</p>
    </div>
  );
}

function List({
  title,
  icon,
  items,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className={`mono-label inline-flex items-center gap-2 ${tone}`}>
        {icon}
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-foreground/85">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The stored AI feasibility review. Read-only — this component never triggers
 * the model, it only presents the existing `proposal_reviews` record.
 */
export function ProposalReviewPanel({
  review,
  industryReady,
  onViewIndustryInterest,
}: {
  review: ProposalReviewRow;
  industryReady: boolean;
  onViewIndustryInterest?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="glass grid-floor relative overflow-hidden rounded-2xl p-5 sm:p-6">
        <span className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan/20 opacity-40 blur-3xl" />
        <p className="mono-label inline-flex items-center gap-2 text-cyan">
          <BrainCircuit className="h-3.5 w-3.5" />
          AI FEASIBILITY ANALYSIS
        </p>

        <div className="relative mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="TECHNICAL FEASIBILITY"
            value={review.technical_feasibility}
            tone={ratingTone[review.technical_feasibility] ?? "text-foreground"}
          />
          <Metric
            label="IMPACT POTENTIAL"
            value={review.impact_potential}
            tone={ratingTone[review.impact_potential] ?? "text-foreground"}
          />
          <Metric
            label="IMPLEMENTATION COMPLEXITY"
            value={review.implementation_complexity}
            tone={complexityTone[review.implementation_complexity] ?? "text-foreground"}
          />
          <Metric
            label="SKILL ALIGNMENT"
            value={review.skill_alignment}
            tone={ratingTone[review.skill_alignment] ?? "text-foreground"}
          />
        </div>

        <div className="glass-soft relative mt-4 rounded-xl p-4">
          <p className="mono-label text-muted-foreground">OVERALL ASSESSMENT</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {review.assessment}
          </p>
        </div>

        <div className="relative mt-4 grid gap-3 lg:grid-cols-3">
          <List
            title="STRENGTHS"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            items={review.strengths ?? []}
            tone="text-signal"
          />
          <List
            title="RISKS"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            items={review.risks ?? []}
            tone="text-warn"
          />
          <List
            title="RECOMMENDATIONS"
            icon={<Lightbulb className="h-3.5 w-3.5" />}
            items={review.recommendations ?? []}
            tone="text-azure"
          />
        </div>

        <p className="relative mt-4 font-mono text-[10px] tracking-[0.14em] text-cyan">
          RECOMMENDED NEXT STEP · {review.next_step.toUpperCase()}
        </p>
      </div>

      {industryReady && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass relative overflow-hidden rounded-2xl border border-signal/40 p-5 sm:p-6"
        >
          <span className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-signal/25 opacity-50 blur-3xl" />
          <p className="mono-label inline-flex items-center gap-2 text-signal">
            <Sparkles className="h-3.5 w-3.5" />
            READY FOR INDUSTRY REVIEW
          </p>
          <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-foreground/85">
            Your solution has completed the university evaluation stage and is now visible to
            eligible industry organizations.
          </p>
          {onViewIndustryInterest && (
            <button
              type="button"
              onClick={onViewIndustryInterest}
              className="relative mt-4 inline-flex items-center gap-2 rounded-xl border border-signal/40 bg-signal/10 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-signal transition-colors hover:border-signal/70"
            >
              <Radio className="h-3.5 w-3.5" />
              VIEW INDUSTRY INTEREST
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
