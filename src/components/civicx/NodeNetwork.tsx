import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { categoryAccent, type ChallengeNode } from "@/lib/civicx-data";
import { cn } from "@/lib/utils";
import { CategoryDot, PriorityChip, StatusChip } from "./StatusChip";

interface NodeNetworkProps {
  nodes: ChallengeNode[];
  links?: [string, string][];
  /** connect every node to its nearest neighbours automatically */
  autoLink?: boolean;
  /** show the label next to each node */
  showLabels?: boolean;
  /** radar sweep + ambient particles */
  ambient?: boolean;
  /** called when a node is clicked */
  onSelect?: (node: ChallengeNode) => void;
  /** ids of nodes that just arrived — they get an extra arrival ring */
  arriving?: string[];
  className?: string;
}

const priorityScale: Record<ChallengeNode["priority"], number> = {
  CRITICAL: 1.25,
  HIGH: 1,
  MEDIUM: 0.8,
  LOW: 0.7,

};

/**
 * Interactive glowing node network: pulsing nodes, animated connections,
 * travelling signal pulses and a glass mission tooltip on hover.
 */
export function NodeNetwork({
  nodes,
  links = [],
  autoLink,
  showLabels = true,
  ambient = false,
  onSelect,
  arriving,
  className,
}: NodeNetworkProps) {
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const edges = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const list: [ChallengeNode, ChallengeNode][] = [];
    const seen = new Set<string>();

    const push = (a: ChallengeNode, b: ChallengeNode) => {
      const key = [a.id, b.id].sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);
      list.push([a, b]);
    };

    for (const [a, b] of links) {
      const na = byId.get(a);
      const nb = byId.get(b);
      if (na && nb) push(na, nb);
    }

    if (autoLink) {
      nodes.forEach((n) => {
        nodes
          .filter((o) => o.id !== n.id)
          .sort(
            (p, q) =>
              (p.x - n.x) ** 2 +
              (p.y - n.y) ** 2 -
              ((q.x - n.x) ** 2 + (q.y - n.y) ** 2),
          )
          .slice(0, 2)
          .forEach((o) => push(n, o));
      });
    }

    return list;
  }, [nodes, links, autoLink]);

  /** a handful of edges carry travelling signal pulses */
  const pulseEdges = useMemo(
    () => edges.filter((_, i) => i % 3 === 0).slice(0, 4),
    [edges],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 37) % 96,
        top: (i * 61) % 92,
        delay: (i % 7) * 1.1,
        duration: 7 + (i % 5) * 1.6,
      })),
    [],
  );

  return (
    <div className={cn("relative h-full w-full", className)}>
      {ambient && !reduced && (
        <>
          {/* slow radar sweep */}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
            style={{
              backgroundImage:
                "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--neon-cyan) 16%, transparent) 32deg, transparent 60deg)",
              animation: "radar-spin 16s linear infinite",
            }}
          />
          {/* ambient particles */}
          {particles.map((p, i) => (
            <span
              key={i}
              className="pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-cyan/70"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </>
      )}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--neon-violet)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {edges.map(([a, b], i) => {
          const lit = active === a.id || active === b.id;
          return (
            <line
              key={`${a.id}-${b.id}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#edge-grad)"
              strokeWidth={lit ? 2 : 1}
              strokeDasharray="5 7"
              vectorEffect="non-scaling-stroke"
              style={{
                opacity: lit ? 1 : 0.6,
                transition: "opacity .3s ease, stroke-width .3s ease",
                animation: reduced
                  ? undefined
                  : `dash-flow ${14 + (i % 5) * 3}s linear infinite`,
              }}
            />
          );
        })}

        {/* signal pulses travelling along a few connections */}
        {!reduced &&
          pulseEdges.map(([a, b], i) => (
            <circle key={`p-${a.id}-${b.id}`} r="1.2" fill="var(--neon-cyan)" opacity="0.9">
              <animateMotion
                dur={`${5 + i * 1.4}s`}
                begin={`${i * 1.6}s`}
                repeatCount="indefinite"
                path={`M${a.x},${a.y} L${b.x},${b.y}`}
                keyPoints="0;1"
                keyTimes="0;1"
                calcMode="linear"
              />
              <animate
                attributeName="opacity"
                values="0;0.95;0.95;0"
                dur={`${5 + i * 1.4}s`}
                begin={`${i * 1.6}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
      </svg>

      {nodes.map((node, i) => {
        const accent = categoryAccent[node.category];
        const isActive = active === node.id;
        const flipLeft = node.x > 58;
        const flipUp = node.y > 60;
        const scale = priorityScale[node.priority];
        const isNew = arriving?.includes(node.id) ?? false;

        return (
          <div
            key={node.id}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: isActive ? 30 : 10 }}
          >
            <motion.button
              type="button"
              aria-label={`${node.code} — ${node.name}, ${node.location}, priority ${node.priority}`}
              onMouseEnter={() => setActive(node.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(node.id)}
              onBlur={() => setActive(null)}
              onClick={() => onSelect?.(node)}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: isNew ? 0 : 0.05 * i }}
              className="relative grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
            >
              <span
                className="absolute rounded-full"
                style={{
                  height: `${1.5 * scale}rem`,
                  width: `${1.5 * scale}rem`,
                  backgroundColor: accent,
                  opacity: node.priority === "CRITICAL" ? 0.28 : 0.2,
                  animation: reduced
                    ? undefined
                    : `pulse-node ${2.2 + (i % 4) * 0.55}s ease-in-out infinite`,
                }}
              />
              {isNew && !reduced && (
                <motion.span
                  className="pointer-events-none absolute rounded-full border"
                  style={{ borderColor: accent }}
                  initial={{ height: "0.6rem", width: "0.6rem", opacity: 0.9 }}
                  animate={{ height: "4.5rem", width: "4.5rem", opacity: 0 }}
                  transition={{ duration: 1.8, repeat: 3, ease: "easeOut" }}
                />
              )}
              <span
                className="rounded-full transition-transform duration-300"
                style={{
                  height: `${0.55 * scale}rem`,
                  width: `${0.55 * scale}rem`,
                  backgroundColor: accent,
                  boxShadow: `0 0 10px ${accent}, 0 0 ${20 * scale}px ${accent}`,
                  transform: isActive ? "scale(1.55)" : "scale(1)",
                }}
              />
            </motion.button>

            {showLabels && (
              <span
                className="pointer-events-none absolute left-4 top-2 hidden whitespace-nowrap font-mono text-[10px] tracking-[0.14em] text-muted-foreground sm:block"
                style={{ opacity: isActive ? 0 : 0.75 }}
              >
                {node.name.toUpperCase()}
              </span>
            )}

            {isActive && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="glass pointer-events-none absolute z-30 w-[250px] rounded-2xl p-4"
                style={{
                  left: flipLeft ? "auto" : 18,
                  right: flipLeft ? 18 : "auto",
                  top: flipUp ? "auto" : 14,
                  bottom: flipUp ? 14 : "auto",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <CategoryDot category={node.category} />
                    <span className="mono-label text-cyan/85">{node.code}</span>
                  </span>
                  <PriorityChip priority={node.priority} />
                </div>

                <p className="mt-3 font-display text-sm font-semibold leading-snug">
                  {node.name}
                </p>

                <dl className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-mono text-foreground/85">{node.location}</dd>
                  </div>
                  {node.affected && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">Estimated impact</dt>
                      <dd className="font-mono text-foreground/85">{node.affected}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-3 border-t border-border/60 pt-2.5">
                  <StatusChip status={node.status} />
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
