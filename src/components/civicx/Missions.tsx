import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { categoryAccent, missions, statusStage } from "@/lib/civicx-data";
import { Reveal, SectionLabel } from "./Reveal";
import { MissionProgress } from "./MissionProgress";
import { CategoryDot, PriorityChip, StatusChip } from "./StatusChip";

function MissionCard({
  mission,
  index,
}: {
  mission: (typeof missions)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const accent = categoryAccent[mission.category];

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1100px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateY(-8px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(1100px) rotateY(0) rotateX(0) translateY(0)";
    setOpen(false);
  };

  return (
    <Reveal delay={index * 0.12}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={onLeave}
        onFocus={() => setOpen(true)}
        className="glass border-flow group relative h-full overflow-hidden rounded-3xl p-6 transition-[transform,box-shadow] duration-300 hover:shadow-[var(--shadow-glow-cyan)] motion-reduce:transform-none"
      >
        <span
          className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
          style={{ backgroundColor: accent }}
        />

        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <CategoryDot category={mission.category} />
            <span className="mono-label truncate text-cyan/85">{mission.code}</span>
          </span>
          <PriorityChip priority={mission.priority} />
        </div>

        <h3 className="mt-4 text-xl font-semibold leading-snug">{mission.title}</h3>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{mission.location}</p>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
            <dt className="mono-label">Impact</dt>
            <dd className="font-mono text-[13px] text-foreground/90">{mission.impact}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
            <dt className="mono-label">Status</dt>
            <dd className="text-right">
              <StatusChip status={mission.status} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="mono-label">AI confidence</dt>
            <dd className="flex items-center gap-2">
              <span className="h-1 w-14 overflow-hidden rounded-full bg-secondary">
                <motion.span
                  className="block h-full rounded-full bg-cyan"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${mission.confidence}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
                />
              </span>
              <span className="font-mono text-[13px] text-cyan">{mission.confidence}%</span>
            </dd>
          </div>
        </dl>

        {/* hover reveal */}
        <motion.div
          initial={false}
          animate={
            open && !reduced
              ? { height: "auto", opacity: 1, marginTop: 18 }
              : { height: 0, opacity: 0, marginTop: 0 }
          }
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <p className="text-[13px] leading-relaxed text-muted-foreground">{mission.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mission.skills.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-cyan/25 bg-cyan/8 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-cyan/90"
              >
                {s.toUpperCase()}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="mt-5">
          <MissionProgress activeStage={statusStage[mission.status]} />
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
    <section id="missions" className="relative scroll-mt-32 px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <SectionLabel>Mission Board</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Every Challenge Is a <span className="text-gradient">Mission.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Each reported challenge becomes a tracked mission with a full lifecycle — from
            first report through to measured impact.
          </p>
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
