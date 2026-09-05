import { useRef } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { categoryAccent, missions } from "@/lib/civicx-data";
import { Reveal, SectionLabel } from "./Reveal";
import { cn } from "@/lib/utils";

const priorityTone: Record<string, string> = {
  CRITICAL: "text-destructive border-destructive/40 bg-destructive/10",
  HIGH: "text-warn border-warn/40 bg-warn/10",
  MEDIUM: "text-cyan border-cyan/40 bg-cyan/10",
};

function MissionCard({ mission, index }: { mission: (typeof missions)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const accent = categoryAccent[mission.category];

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-6px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1000px) rotateY(0) rotateX(0) translateY(0)";
  };

  return (
    <Reveal delay={index * 0.12}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="glass glow-ring group relative h-full overflow-hidden rounded-3xl p-6 transition-transform duration-300 motion-reduce:transform-none"
      >
        <span
          className="absolute inset-x-0 top-0 h-px opacity-60"
          style={{ backgroundImage: "var(--gradient-accent)" }}
        />
        <span
          className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
          style={{ backgroundColor: accent }}
        />

        <div className="flex items-center justify-between gap-3">
          <span className="mono-label text-cyan/80">{mission.code}</span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em]",
              priorityTone[mission.priority],
            )}
          >
            {mission.priority}
          </span>
        </div>

        <h3 className="mt-4 text-xl font-semibold leading-snug">{mission.title}</h3>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
            <dt className="text-muted-foreground">Impact</dt>
            <dd className="font-mono text-foreground/90">{mission.impact}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-right font-mono text-[11px] tracking-[0.1em] text-cyan">
              {mission.status}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <motion.span
              className="block h-full rounded-full"
              style={{ backgroundImage: "var(--gradient-accent)" }}
              initial={{ width: 0 }}
              whileInView={{ width: `${mission.progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
            />
          </div>
          <span className="mt-2 block font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
            LIFECYCLE {mission.progress}%
          </span>
        </div>

        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-2.5 font-mono text-[11px] tracking-[0.16em] text-cyan transition-all duration-300 hover:bg-cyan/20 hover:shadow-[var(--shadow-glow-cyan)] active:scale-[0.97]"
        >
          VIEW MISSION
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </Reveal>
  );
}

export function Missions() {
  return (
    <section id="missions" className="relative scroll-mt-28 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <SectionLabel>Mission Board</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Every Challenge Is a <span className="text-gradient">Mission.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {missions.map((m, i) => (
            <MissionCard key={m.code} mission={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
