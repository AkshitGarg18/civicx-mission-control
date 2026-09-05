import { motion, useReducedMotion } from "motion/react";
import { Counter } from "@/components/civicx/Counter";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { civicStats } from "@/lib/citizen-data";

/** Four accented statistic cards with animated counters. */
export function CivicStatus() {
  const reduced = useReducedMotion();

  return (
    <section id="command-center" className="scroll-mt-24">
      <Reveal>
        <SectionLabel>CIVIC STATUS</SectionLabel>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {civicStats.map((stat, i) => (
          <Reveal key={stat.label} delay={0.06 * i}>
            <motion.article
              whileHover={reduced ? {} : { y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass border-flow group relative h-full overflow-hidden rounded-2xl p-5 motion-reduce:transform-none"
            >
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
                style={{ backgroundColor: stat.accent }}
              />
              <span
                className="absolute inset-x-5 top-0 h-px"
                style={{
                  backgroundImage: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)`,
                }}
              />
              <p className="mono-label text-muted-foreground">{stat.label}</p>
              <p
                className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: stat.accent }}
              >
                <Counter
                  value={stat.value}
                  {...(stat.decimals ? { decimals: stat.decimals } : {})}
                  {...(stat.suffix ? { suffix: stat.suffix } : {})}
                  duration={1400 + i * 160}
                />
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{stat.caption}</p>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
