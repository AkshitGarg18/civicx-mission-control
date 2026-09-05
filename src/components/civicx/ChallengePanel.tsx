import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import {
  categoryAccent,
  lifecycleStages,
  statusStage,
  type ChallengeNode,
} from "@/lib/civicx-data";
import { CategoryDot, PriorityChip, StatusChip } from "./StatusChip";

/** Sliding mission dossier for a selected challenge. */
export function ChallengePanel({
  node,
  onClose,
}: {
  node: ChallengeNode | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node, onClose]);

  return (
    <AnimatePresence>
      {node && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Close mission dossier"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-background/70 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-label={`${node.code} dossier`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 48 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="glass absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col overflow-y-auto rounded-l-3xl p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="flex items-center gap-2">
                  <CategoryDot category={node.category} />
                  <span className="mono-label text-cyan/85">{node.code}</span>
                </span>
                <h3 className="mt-3 text-2xl font-semibold leading-tight">{node.name}</h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {node.location}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-cyan/40 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <PriorityChip priority={node.priority} />
              <StatusChip status={node.status} />
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {node.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              {[
                { k: "Category", v: node.category },
                { k: "People affected", v: node.affected },
                { k: "Priority", v: node.priority },
                { k: "AI confidence", v: `${node.confidence}%` },
              ].map((row) => (
                <div key={row.k} className="glass-soft rounded-2xl px-4 py-3">
                  <dt className="mono-label">{row.k}</dt>
                  <dd className="mt-1.5 font-mono text-sm text-foreground/90">{row.v}</dd>
                </div>
              ))}
            </dl>

            <section className="mt-6">
              <span className="mono-label text-violet/85">AI Analysis</span>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {node.aiAnalysis}
              </p>
            </section>

            <section className="mt-6">
              <span className="mono-label">Recommended skills</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {node.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-cyan/25 bg-cyan/8 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan/90"
                  >
                    {s.toUpperCase()}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <span className="mono-label">Lifecycle</span>
              <div className="mt-3 space-y-2.5">
                {lifecycleStages.map((stage, i) => {
                  const current = statusStage[node.status];
                  const done = i < current;
                  const isNow = i === current;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor: isNow
                            ? categoryAccent[node.category]
                            : done
                              ? "var(--signal)"
                              : "var(--border)",
                          boxShadow: isNow
                            ? `0 0 10px ${categoryAccent[node.category]}`
                            : undefined,
                        }}
                      />
                      <span
                        className={
                          isNow
                            ? "font-mono text-[11px] tracking-[0.16em] text-foreground"
                            : "font-mono text-[11px] tracking-[0.16em] text-muted-foreground"
                        }
                      >
                        {stage}
                      </span>
                      {isNow && (
                        <span className="mono-label text-[9px] text-cyan/80">CURRENT</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <p className="mt-8 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-muted-foreground/70">
              DEMO DATA — SHOWN FOR THIS PROTOTYPE PREVIEW
            </p>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
