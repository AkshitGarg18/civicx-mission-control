import { motion, useReducedMotion } from "motion/react";
import { Plus, Radio } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";

/** Primary action card: opens the report-a-challenge flow. */
export function ReportSignal({ onOpen }: { onOpen: () => void }) {
  const reduced = useReducedMotion();

  return (
    <section id="report" className="scroll-mt-24">
      <Reveal>
        <SectionLabel>SIGNAL INTAKE</SectionLabel>
      </Reveal>

      <Reveal delay={0.08} className="mt-6">
        <div className="glass grid-floor relative overflow-hidden rounded-[1.75rem] p-6 sm:p-10">
          <span
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          />
          <motion.span
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ backgroundImage: "var(--gradient-accent)" }}
            animate={reduced ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] text-cyan">
                <Radio className="h-3.5 w-3.5" />
                REPORT A CHALLENGE
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                See a problem? <span className="text-gradient">Send a signal.</span>
              </h2>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Four quick steps. CivicX intelligence classifies it, estimates who it affects and
                routes it to the universities and industries that can solve it.
              </p>
            </div>

            <motion.button
              type="button"
              onClick={onOpen}
              whileHover={reduced ? {} : { y: -3 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-2xl px-7 py-4 font-mono text-[11px] font-semibold tracking-[0.18em] text-background shadow-[var(--shadow-glow-cyan)] motion-reduce:transform-none"
              style={{ backgroundImage: "var(--gradient-accent)" }}
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              REPORT NEW CHALLENGE
            </motion.button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
