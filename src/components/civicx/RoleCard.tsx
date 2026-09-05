import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { RoleDefinition } from "@/lib/civicx-roles";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  role: RoleDefinition;
  /** id of the currently selected role, if any */
  selected: string | null;
  onSelect: (role: RoleDefinition) => void;
  index: number;
}

/** Selectable mission-role card with 3D tilt, accent glow and staged reveal. */
export function RoleCard({ role, selected, onSelect, index }: RoleCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hover, setHover] = useState(false);

  const isSelected = selected === role.id;
  const dimmed = selected !== null && !isSelected;
  const Icon = role.icon;

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 8, ry: px * 10 });
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => onSelect(role)}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setTilt({ rx: 0, ry: 0 });
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={
        reduced
          ? { opacity: dimmed ? 0.35 : 1 }
          : {
              opacity: dimmed ? 0.3 : 1,
              y: 0,
              filter: "blur(0px)",
              scale: isSelected ? 1.03 : 1,
              rotateX: tilt.rx,
              rotateY: tilt.ry,
            }
      }
      transition={{
        duration: 0.6,
        delay: selected ? 0 : 0.12 * index,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className={cn(
        "border-flow group relative flex flex-col overflow-hidden rounded-[1.6rem] p-6 text-left glass sm:p-8",
        "transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {/* accent wash */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: `radial-gradient(120% 90% at 15% 0%, color-mix(in oklab, ${role.accent} 26%, transparent), transparent 65%)`,
          opacity: hover || isSelected ? 1 : 0.42,
        }}
      />
      <span className="pointer-events-none absolute inset-0 grid-floor opacity-25" />
      <span
        className="pointer-events-none absolute inset-0 rounded-[1.6rem] transition-all duration-500"
        style={{
          boxShadow:
            hover || isSelected
              ? `0 0 0 1px color-mix(in oklab, ${role.accent} 55%, transparent), 0 24px 60px -24px color-mix(in oklab, ${role.accent} 70%, transparent)`
              : "none",
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <span
          className="grid h-14 w-14 place-items-center rounded-2xl border transition-transform duration-500 group-hover:-translate-y-0.5"
          style={{
            borderColor: `color-mix(in oklab, ${role.accent} 40%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${role.accent} 12%, transparent)`,
            color: role.accent,
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <span className="mono-label">ROLE 0{index + 1}</span>
      </div>

      <h3
        className={cn(
          "relative mt-6 font-mono text-lg tracking-[0.26em]",
          role.textClass,
        )}
      >
        {role.title}
      </h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
        {role.description}
      </p>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {role.tags.map((t, i) => (
          <motion.span
            key={t}
            animate={reduced ? {} : { y: hover ? -2 : 0, opacity: hover ? 1 : 0.75 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
            className="rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.18em]"
            style={{
              borderColor: `color-mix(in oklab, ${role.accent} 35%, transparent)`,
              backgroundColor: `color-mix(in oklab, ${role.accent} 10%, transparent)`,
              color: role.accent,
            }}
          >
            {t}
          </motion.span>
        ))}
      </div>

      <span
        className="relative mt-7 inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] transition-colors duration-300"
        style={{
          borderColor: `color-mix(in oklab, ${role.accent} 45%, transparent)`,
          backgroundColor: `color-mix(in oklab, ${role.accent} ${hover || isSelected ? 22 : 10}%, transparent)`,
          color: role.accent,
        }}
      >
        {role.cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5 motion-reduce:transform-none" />
      </span>
    </motion.button>
  );
}
