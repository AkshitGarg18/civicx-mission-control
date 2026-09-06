import { ChevronDown } from "lucide-react";

export interface PipelineStage {
  label: string;
  tone: string;
}

/**
 * Vertical mission pipeline. Only stages that actually exist for the mission
 * are passed in — nothing is displayed speculatively.
 */
export function MissionPipeline({ stages }: { stages: PipelineStage[] }) {
  if (stages.length === 0) return null;
  return (
    <div className="mt-4 space-y-1.5">
      {stages.map((stage, i) => (
        <div key={stage.label}>
          <span
            className={`inline-flex rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${stage.tone}`}
          >
            {stage.label}
          </span>
          {i < stages.length - 1 && (
            <ChevronDown className="ml-2 h-3 w-3 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

/** Derives the pipeline purely from stored records. */
export function buildStages(input: {
  teamStatus: string;
  proposalStatus: string | null;
  hasReview: boolean;
  collaborationStatus: string | null;
}): PipelineStage[] {
  const stages: PipelineStage[] = [];

  if (input.teamStatus === "TEAM_FORMED") {
    stages.push({
      label: "TEAM FORMED",
      tone: "text-violet border-violet/40 bg-violet/10",
    });
  } else {
    stages.push({
      label: input.teamStatus.replace(/_/g, " "),
      tone: "text-muted-foreground border-border bg-muted/20",
    });
  }

  const status = input.proposalStatus;
  if (status) {
    stages.push({
      label: "PROPOSAL DRAFT",
      tone: "text-muted-foreground border-border bg-muted/20",
    });
    if (status !== "DRAFT") {
      stages.push({
        label: "PROPOSAL SUBMITTED",
        tone: "text-azure border-azure/40 bg-azure/10",
      });
    }
    if (status === "UNDER_AI_REVIEW") {
      stages.push({ label: "AI REVIEW", tone: "text-warn border-warn/40 bg-warn/10" });
    }
    if (status === "AI_REVIEW_COMPLETE") {
      stages.push({
        label: "AI REVIEW COMPLETE",
        tone: "text-signal border-signal/40 bg-signal/10",
      });
      if (input.hasReview) {
        stages.push({
          label: "READY FOR INDUSTRY REVIEW",
          tone: "text-signal border-signal/40 bg-signal/10",
        });
      }
    }
  }

  if (input.collaborationStatus) {
    stages.push({
      label:
        input.collaborationStatus === "COMPLETED"
          ? "IMPACT DELIVERED"
          : input.collaborationStatus === "INTEREST_EXPRESSED"
            ? "INDUSTRY INTEREST"
            : "INDUSTRY COLLABORATION",
      tone: "text-warn border-warn/40 bg-warn/10",
    });
  }

  return stages;
}
