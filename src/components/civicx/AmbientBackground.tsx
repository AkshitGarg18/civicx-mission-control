import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface Particle {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  hue: "cyan" | "violet" | "azure";
}

function makeParticles(count: number): Particle[] {
  const hues: Particle["hue"][] = ["cyan", "violet", "azure"];
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * n) + 1) / 2);
    return {
      left: r(12.9898) * 100,
      top: r(78.233) * 100,
      size: 1 + r(43.7585) * 2.4,
      delay: r(31.4159) * 8,
      duration: 9 + r(6.283) * 12,
      hue: hues[i % 3]!,
    };
  });
}

const hueVar: Record<Particle["hue"], string> = {
  cyan: "var(--neon-cyan)",
  violet: "var(--neon-violet)",
  azure: "var(--neon-azure)",
};

/** Fixed, non-distracting atmospheric layer: gradients, grid, particles, noise. */
export function AmbientBackground() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const particles = useMemo(() => makeParticles(46), []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden noise-overlay"
    >
      {/* atmospheric gradients */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      />
      <div className="absolute inset-0 bg-background/40" />

      {/* glowing grid with perspective fade */}
      <div
        className="absolute inset-0 grid-floor opacity-70"
        style={{
          maskImage:
            "radial-gradient(120% 80% at 50% 10%, black 10%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 50% 10%, black 10%, transparent 75%)",
        }}
      />

      {/* slow geometric elements */}
      {!reduced && (
        <>
          <div
            className="absolute -left-32 top-1/4 h-72 w-72 rotate-12 rounded-[3rem] border border-cyan/10"
            style={{ animation: "drift-slow 34s ease-in-out infinite alternate" }}
          />
          <div
            className="absolute -right-24 top-2/3 h-96 w-96 rounded-full border border-violet/10"
            style={{ animation: "drift-slow 46s ease-in-out infinite alternate-reverse" }}
          />
          <div
            className="absolute left-1/2 top-10 h-40 w-40 -rotate-12 border border-azure/10"
            style={{ animation: "drift-slow 40s ease-in-out infinite alternate" }}
          />
        </>
      )}

      {/* particles */}
      {mounted &&
        particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              backgroundColor: hueVar[p.hue],
              boxShadow: `0 0 8px ${hueVar[p.hue]}`,
              opacity: 0.35,
            }}
            animate={
              reduced ? {} : { y: [0, -34, 0], opacity: [0.12, 0.5, 0.12] }
            }
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

      {/* faint connection lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.13]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bg-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--neon-cyan)" />
            <stop offset="100%" stopColor="var(--neon-violet)" />
          </linearGradient>
        </defs>
        {[
          "M0,120 L420,320 L900,180 L1440,420",
          "M0,620 L380,520 L860,740 L1440,560",
          "M120,0 L300,300 L240,760",
          "M1200,0 L1040,380 L1300,820",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="url(#bg-line)"
            strokeWidth="1"
            strokeDasharray="6 10"
            style={reduced ? undefined : { animation: `dash-flow ${26 + i * 6}s linear infinite` }}
          />
        ))}
      </svg>

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_40%,var(--background)_100%)]" />
    </div>
  );
}
