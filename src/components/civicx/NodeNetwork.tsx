import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  categoryAccent,
  type ChallengeNode,
} from "@/lib/civicx-data";
import { cn } from "@/lib/utils";

interface NodeNetworkProps {
  nodes: ChallengeNode[];
  links?: [string, string][];
  /** connect every node to its nearest neighbours automatically */
  autoLink?: boolean;
  /** show the label next to each node */
  showLabels?: boolean;
  className?: string;
}

const priorityTone: Record<ChallengeNode["priority"], string> = {
  CRITICAL: "text-destructive border-destructive/40 bg-destructive/10",
  HIGH: "text-warn border-warn/40 bg-warn/10",
  MEDIUM: "text-cyan border-cyan/40 bg-cyan/10",
};

/** Interactive glowing node network with glass detail card on hover. */
export function NodeNetwork({
  nodes,
  links = [],
  autoLink,
  showLabels = true,
  className,
}: NodeNetworkProps) {
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: [ChallengeNode, ChallengeNode][] = [];

  for (const [a, b] of links) {
    const na = byId.get(a);
    const nb = byId.get(b);
    if (na && nb) edges.push([na, nb]);
  }

  if (autoLink) {
    nodes.forEach((n) => {
      const nearest = nodes
        .filter((o) => o.id !== n.id)
        .sort(
          (p, q) =>
            (p.x - n.x) ** 2 + (p.y - n.y) ** 2 - ((q.x - n.x) ** 2 + (q.y - n.y) ** 2),
        )
        .slice(0, 2);
      nearest.forEach((o) => edges.push([n, o]));
    });
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
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
                opacity: lit ? 1 : 0.65,
                transition: "opacity .3s ease, stroke-width .3s ease",
                animation: reduced ? undefined : `dash-flow ${14 + (i % 5) * 3}s linear infinite`,
              }}
            />
          );
        })}
      </svg>

      {nodes.map((node, i) => {
        const accent = categoryAccent[node.category];
        const isActive = active === node.id;
        const flipLeft = node.x > 62;
        const flipUp = node.y > 62;

        return (
          <div
            key={node.id}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <motion.button
              type="button"
              aria-label={`${node.name} — ${node.location}`}
              onMouseEnter={() => setActive(node.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(node.id)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(isActive ? null : node.id)}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06 * i }}
              className="relative grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none"
            >
              <span
                className="absolute h-6 w-6 rounded-full"
                style={{
                  backgroundColor: accent,
                  opacity: 0.22,
                  animation: reduced
                    ? undefined
                    : `pulse-node ${2.4 + (i % 4) * 0.5}s ease-in-out infinite`,
                }}
              />
              <span
                className="h-2.5 w-2.5 rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 10px ${accent}, 0 0 22px ${accent}`,
                  transform: isActive ? "scale(1.5)" : "scale(1)",
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
                initial={{ opacity: 0, scale: 0.94, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="glass pointer-events-none absolute z-20 w-[228px] rounded-2xl p-4"
                style={{
                  left: flipLeft ? "auto" : 18,
                  right: flipLeft ? 18 : "auto",
                  top: flipUp ? "auto" : 14,
                  bottom: flipUp ? 14 : "auto",
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                  <span className="mono-label">{node.category}</span>
                </div>
                <p className="mt-2 font-display text-sm font-semibold leading-snug">
                  {node.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{node.location}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em]",
                      priorityTone[node.priority],
                    )}
                  >
                    {node.priority}
                  </span>
                  <span className="font-mono text-[11px] text-foreground/80">
                    {node.affected}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
