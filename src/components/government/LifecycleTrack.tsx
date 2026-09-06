import { motion } from "motion/react";
import { stageTone, type LifecycleStage } from "@/lib/government-data";

/**
 * Vertical civic lifecycle. Every stage state is derived from stored records;
 * stages the backend cannot evidence read NOT YET TRACKED.
 */
export function LifecycleTrack({
  stages,
  compact = false,
}: {
  stages: LifecycleStage[];
  compact?: boolean;
}) {
  return (
    <ol className="relative space-y-2 pl-4">
      <span className="absolute left-1 top-2 bottom-2 w-px bg-border/70" />
      {stages.map((stage, i) => (
        <motion.li
          key={stage.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
          className="relative"
        >
          <span
            className={
              stage.state === "done"
                ? "absolute -left-[0.9rem] top-2 h-2 w-2 rounded-full bg-signal"
                : stage.state === "current"
                  ? "absolute -left-[0.9rem] top-2 h-2 w-2 rounded-full bg-violet motion-safe:animate-pulse"
                  : "absolute -left-[0.9rem] top-2 h-2 w-2 rounded-full border border-border bg-background"
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${stageTone[stage.state]}`}
            >
              {stage.label}
            </span>
            {stage.state === "untracked" && (
              <span className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground">
                NOT YET TRACKED
              </span>
            )}
          </div>
          {!compact && (
            <p className="mt-1 text-xs text-muted-foreground">{stage.detail}</p>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
