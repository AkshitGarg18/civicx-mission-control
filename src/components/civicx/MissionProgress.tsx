import { motion, useReducedMotion } from "motion/react";
import { lifecycleStages } from "@/lib/civicx-data";
import { cn } from "@/lib/utils";

/**
 * Lifecycle rail: REPORT → AI ANALYSIS → MATCHING → COLLABORATION → IMPACT.
 * The active stage glows and the fill animates into view.
 */
export function MissionProgress({
  activeStage,
  className,
}: {
  activeStage: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pct = (activeStage / (lifecycleStages.length - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-px w-full bg-border">
        <motion.span
          className="absolute inset-y-0 left-0 block"
          style={{ backgroundImage: "var(--gradient-accent)" }}
          initial={{ width: reduced ? `${pct}%` : 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-x-0 -top-[3px] flex justify-between">
          {lifecycleStages.map((stage, i) => {
            const done = i < activeStage;
            const isNow = i === activeStage;
            return (
              <span key={stage} className="relative flex h-1.5 w-1.5">
                {isNow && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-cyan opacity-70 motion-safe:animate-ping" />
                )}
                <span
                  className="relative h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: isNow
                      ? "var(--neon-cyan)"
                      : done
                        ? "var(--signal)"
                        : "var(--border)",
                    boxShadow: isNow ? "0 0 10px var(--neon-cyan)" : undefined,
                  }}
                />
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-between gap-1">
        {lifecycleStages.map((stage, i) => (
          <span
            key={stage}
            className={cn(
              "font-mono text-[9px] leading-tight tracking-[0.1em] sm:text-[10px]",
              i === activeStage
                ? "text-cyan"
                : i < activeStage
                  ? "text-foreground/70"
                  : "text-muted-foreground/60",
            )}
          >
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}
