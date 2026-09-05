import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { analysisSteps, demoAnalysis, type AiAnalysisResult } from "@/lib/citizen-data";
import { PriorityChip } from "@/components/civicx/StatusChip";

/**
 * Cinematic AI analysis screen.
 *
 * `result` is injected so a real Gemini response can replace `demoAnalysis`
 * later without changing this component.
 */
export function AiAnalysis({
  result = demoAnalysis,
  onCreateMission,
}: {
  result?: AiAnalysisResult;
  onCreateMission: () => void;
}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(reduced ? analysisSteps.length : 0);

  useEffect(() => {
    if (reduced) return;
    const timers = analysisSteps.map((_, i) =>
      setTimeout(() => setDone(i + 1), 420 + i * 480),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const complete = done >= analysisSteps.length;

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet/40 bg-violet/10">
          <Sparkles className="h-4 w-4 text-violet" />
        </span>
        <div>
          <p className="mono-label text-violet">CIVICX INTELLIGENCE</p>
          <p className="mt-1 font-mono text-sm tracking-[0.14em]">
            {complete ? "AI ANALYSIS COMPLETE" : "ANALYZING CIVIC SIGNAL..."}
          </p>
        </div>
      </div>

      {/* scanning beam */}
      {!complete && (
        <div className="relative mt-6 h-px w-full overflow-hidden bg-border">
          <motion.span
            className="absolute inset-y-0 w-1/3"
            style={{ backgroundImage: "var(--gradient-accent)" }}
            animate={reduced ? {} : { x: ["-100%", "300%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      <ul className="mt-6 space-y-2.5">
        {analysisSteps.map((step, i) => {
          const state = i < done ? "done" : i === done ? "active" : "idle";
          return (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: state === "idle" ? 0.4 : 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 font-mono text-[11px] tracking-[0.12em] sm:text-xs"
            >
              {state === "done" ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-signal" />
              ) : state === "active" ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan" />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
              )}
              <span className={state === "done" ? "text-foreground/80" : state === "active" ? "text-cyan" : "text-muted-foreground"}>
                {step}
              </span>
            </motion.li>
          );
        })}
      </ul>

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Readout label="CATEGORY" value={result.category} />
              <div className="glass-soft rounded-xl p-4">
                <p className="mono-label text-muted-foreground">PRIORITY</p>
                <div className="mt-2">
                  <PriorityChip priority={result.priority} />
                </div>
              </div>
              <Readout label="AI CONFIDENCE" value={`${result.confidence}%`} accent="var(--neon-cyan)" />
              <Readout label="ESTIMATED IMPACT" value={result.impact} accent="var(--neon-violet)" />
            </div>

            <div className="glass-soft mt-3 rounded-xl p-4">
              <p className="mono-label text-muted-foreground">RECOMMENDED SKILLS</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-soft mt-3 rounded-xl p-4">
              <p className="mono-label text-muted-foreground">AI SUMMARY</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">{result.summary}</p>
            </div>

            <motion.button
              type="button"
              onClick={onCreateMission}
              whileHover={reduced ? {} : { y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background motion-reduce:transform-none sm:w-auto"
              style={{ backgroundImage: "var(--gradient-accent)" }}
            >
              CREATE MISSION
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
    </div>
  );
}
