import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Counter } from "@/components/civicx/Counter";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { impactMetrics } from "@/lib/citizen-data";

/** Animated circular gauge showing the citizen's contribution score. */
function ImpactRing({ percent }: { percent: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(reduced ? percent : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [inView, percent, reduced]);

  return (
    <div className="relative grid place-items-center">
      <svg ref={ref} viewBox="0 0 200 200" className="h-52 w-52 -rotate-90">
        <defs>
          <linearGradient id="impact-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--neon-cyan)" />
            <stop offset="50%" stopColor="var(--neon-azure)" />
            <stop offset="100%" stopColor="var(--neon-violet)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#impact-ring)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - shown / 100) }}
          initial={{ strokeDashoffset: circumference }}
          transition={{ duration: reduced ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 0 8px color-mix(in oklab, var(--neon-cyan) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-semibold tracking-tight">
          <Counter value={percent} suffix="%" />
        </p>
        <p className="mono-label mt-1 text-muted-foreground">CIVIC SCORE</p>
      </div>
    </div>
  );
}

/** Community impact section with gauge and metric readouts. */
export function CommunityImpact() {
  const reduced = useReducedMotion();

  return (
    <section id="impact" className="scroll-mt-24">
      <Reveal>
        <SectionLabel>YOUR CIVIC IMPACT</SectionLabel>
      </Reveal>

      <Reveal delay={0.08} className="mt-6">
        <div className="glass relative overflow-hidden rounded-[1.75rem] p-6 sm:p-10">
          <span
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-[auto_1fr]">
            <ImpactRing percent={68} />

            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Every report increases the visibility of problems that matter.
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {impactMetrics.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    whileInView={reduced ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-soft rounded-xl p-4"
                  >
                    <p className="text-2xl font-semibold tracking-tight" style={{ color: m.accent }}>
                      <Counter
                        value={m.value}
                        {...(m.decimals ? { decimals: m.decimals } : {})}
                        {...(m.suffix ? { suffix: m.suffix } : {})}
                      />
                    </p>
                    <p className="mono-label mt-2 text-muted-foreground">{m.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
