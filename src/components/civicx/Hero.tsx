import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Radar } from "lucide-react";
import { heroLinks, heroNodes } from "@/lib/civicx-data";
import { NodeNetwork } from "./NodeNetwork";
import { Counter } from "./Counter";

export function Hero() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const visualY = useTransform(scrollY, [0, 600], [0, reduced ? 0 : -60]);
  const copyY = useTransform(scrollY, [0, 600], [0, reduced ? 0 : 40]);

  return (
    <section id="top" className="relative px-4 pb-16 pt-32 sm:px-6 sm:pt-40 lg:pb-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <motion.div style={{ y: copyY }} className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass inline-flex items-center gap-3 rounded-full px-4 py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-70 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]" />
            </span>
            <span className="mono-label text-signal/90">System Online</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-[11px] text-muted-foreground">
              <Counter value={2847} /> challenges monitored
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-[4rem]"
          >
            Turn Real-World Problems Into{" "}
            <span className="text-gradient">Real-World Solutions.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Connect citizens, universities, industry and government to transform societal
            challenges into measurable impact.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.26 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="#launch"
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium text-primary-foreground transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
              style={{
                backgroundImage: "var(--gradient-accent)",
                boxShadow: "var(--shadow-glow-cyan)",
              }}
            >
              Report a Challenge
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="#live-world"
              className="glass glow-ring inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-medium text-foreground active:scale-[0.97]"
            >
              <Radar className="h-4 w-4 text-cyan" />
              Explore Challenges
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: visualY }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-w-0"
        >
          <div className="glass relative overflow-hidden rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="mono-label">Live Challenge Grid</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-cyan/80">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_var(--neon-cyan)]" />
                REALTIME
              </span>
            </div>

            <div className="relative mt-3 h-[320px] overflow-hidden rounded-2xl border border-border/70 bg-background/40 grid-floor sm:h-[400px] lg:h-[460px]">
              {/* scan sweep */}
              {!reduced && (
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-cyan/10 to-transparent"
                  style={{ animation: "sweep 6s linear infinite" }}
                />
              )}
              <div className="absolute inset-5 sm:inset-8">
                <NodeNetwork nodes={heroNodes} links={heroLinks} />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              <span className="glass-soft rounded-lg px-3 py-2">NODES 06</span>
              <span className="glass-soft rounded-lg px-3 py-2">LINKS 08</span>
              <span className="glass-soft rounded-lg px-3 py-2 text-signal/90">SYNCED</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
