import { categoryAccent, type ChallengeNode, type MissionStatus } from "@/lib/civicx-data";
import { cn } from "@/lib/utils";

export const priorityTone: Record<ChallengeNode["priority"], string> = {
  CRITICAL: "text-destructive border-destructive/40 bg-destructive/10",
  HIGH: "text-warn border-warn/40 bg-warn/10",
  MEDIUM: "text-cyan border-cyan/40 bg-cyan/10",
  LOW: "text-muted-foreground border-border bg-muted/20",
};

const statusTone: Record<MissionStatus, string> = {
  "SIGNAL DETECTED": "text-warn",
  "AI ANALYSIS COMPLETE": "text-violet",
  "MATCHING IN PROGRESS": "text-azure",
  "TEAM FOUND": "text-cyan",
  "INDUSTRY SUPPORT AVAILABLE": "text-cyan",
  "MISSION ACTIVE": "text-signal",
  "MISSION COMPLETED": "text-signal",
};

/** Small mission-control status readout with a pulsing signal dot. */
export function StatusChip({
  status,
  className,
}: {
  status: MissionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] leading-none tracking-[0.16em]",
        statusTone[status],
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {status}
    </span>
  );
}

export function PriorityChip({
  priority,
  className,
}: {
  priority: ChallengeNode["priority"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em]",
        priorityTone[priority],
        className,
      )}
    >
      {priority}
    </span>
  );
}

export function CategoryDot({ category }: { category: ChallengeNode["category"] }) {
  const accent = categoryAccent[category];
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
    />
  );
}
