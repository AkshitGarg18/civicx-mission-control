import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  categories,
  liveStats,
  mapNodes,
  type ChallengeCategory,
  type ChallengeNode,
} from "@/lib/civicx-data";
import { NodeNetwork } from "./NodeNetwork";
import { Counter } from "./Counter";
import { Reveal, SectionLabel } from "./Reveal";
import { LiveSignals } from "./LiveSignals";
import { ChallengePanel } from "./ChallengePanel";
import { cn } from "@/lib/utils";

/** Abstract India silhouette (stylised, not cartographic). */
const INDIA_PATH =
  "M38 4 L52 8 L60 4 L68 10 L78 12 L86 20 L82 28 L88 34 L80 40 L74 38 L70 44 L66 42 L62 50 L58 62 L54 74 L48 88 L44 96 L38 84 L34 72 L28 62 L24 52 L18 44 L14 34 L20 28 L18 18 L26 12 Z";

export function LiveWorld() {
  const [filter, setFilter] = useState<"All" | ChallengeCategory>("All");
  const [selected, setSelected] = useState<ChallengeNode | null>(null);

  const nodes = useMemo(
    () => (filter === "All" ? mapNodes : mapNodes.filter((n) => n.category === filter)),
    [filter],
  );

  return (
    <section id="live-world" className="relative scroll-mt-32 px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <SectionLabel>Live World</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            See What's Happening <span className="text-gradient">Around You.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            A live view of reported challenges across the country. Hover a signal for the
            summary, select it to open the full mission dossier. Demo data shown for this
            preview.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={cn(
                  "rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-all duration-300 active:scale-95",
                  filter === c
                    ? "border-cyan/50 bg-cyan/15 text-cyan shadow-[var(--shadow-glow-cyan)]"
                    : "border-border text-muted-foreground hover:border-cyan/30 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Reveal delay={0.15}>
            <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="mono-label text-cyan/85">Signal Map · India</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-signal/90">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
                  </span>
                  LIVE DATA (DEMO)
                </span>
              </div>

              <div className="relative mt-3 h-[380px] w-full overflow-hidden rounded-2xl border border-border/70 bg-background/40 grid-floor sm:h-[520px]">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                  aria-label="Abstract map of India"
                >
                  <defs>
                    <linearGradient id="india-fill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--neon-azure)" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="var(--neon-violet)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <path
                    d={INDIA_PATH}
                    fill="url(#india-fill)"
                    stroke="var(--neon-cyan)"
                    strokeOpacity="0.45"
                    strokeWidth="0.4"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <div className="absolute inset-0">
                  <NodeNetwork
                    key={filter}
                    nodes={nodes}
                    autoLink
                    ambient
                    showLabels={false}
                    onSelect={setSelected}
                  />
                </div>
                <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                  {nodes.length.toString().padStart(2, "0")} SIGNALS · {filter.toUpperCase()}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.22}>
            <LiveSignals />
          </Reveal>
        </div>

        <div id="impact" className="mt-5 grid scroll-mt-32 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {liveStats.map((s, i) => (
            <Reveal key={s.label} delay={0.08 * i}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="glass glow-ring flex h-full flex-col justify-center rounded-2xl px-5 py-5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="mono-label">{s.label}</span>
                  <span className="flex items-center gap-1 font-mono text-[9px] tracking-[0.14em] text-signal/80">
                    <span className="relative flex h-1 w-1">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-1 w-1 rounded-full bg-signal" />
                    </span>
                    LIVE
                  </span>
                </span>
                <span className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                  <Counter
                    value={s.value}
                    decimals={"decimals" in s ? (s.decimals as number) : 0}
                    suffix={s.suffix}
                    duration={1400 + i * 200}
                  />
                </span>
                <span
                  className="mt-3 h-px w-full"
                  style={{ backgroundImage: "var(--gradient-accent)", opacity: 0.5 }}
                />
              </motion.div>
            </Reveal>
          ))}
        </div>

        <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground/60">
          FIGURES SHOWN ARE DEMO DATA FOR THIS PROTOTYPE, NOT OFFICIAL GOVERNMENT STATISTICS.
        </p>
      </div>

      <ChallengePanel node={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
