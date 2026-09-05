import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Radio } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { NodeNetwork } from "@/components/civicx/NodeNetwork";
import { ChallengePanel } from "@/components/civicx/ChallengePanel";
import { CategoryDot, PriorityChip } from "@/components/civicx/StatusChip";
import type { ChallengeNode, Priority } from "@/lib/civicx-data";
import { nearbyChallenges } from "@/lib/citizen-data";
import {
  CHALLENGE_CREATED_EVENT,
  getMapChallenges,
  hasCoordinates,
  subscribeToNewChallenges,
  toChallengeNode,
  type ChallengeRow,
} from "@/lib/challenges-service";
import { MissionDetail } from "./MissionDetail";

/** Category filters, matching the labels used across the platform. */
const categoryFilters = [
  { label: "ALL", match: null },
  { label: "WATER", match: "Water" },
  { label: "WASTE", match: "Waste" },
  { label: "EDUCATION", match: "Education" },
  { label: "HEALTHCARE", match: "Healthcare" },
  { label: "INFRASTRUCTURE", match: "Infrastructure" },
  { label: "PUBLIC SAFETY", match: "Safety" },
  { label: "ENVIRONMENT", match: "Waste" },
] as const;

const priorityFilters = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

/** Community signal map: real civic signals as glowing nodes. */
export function NearbyChallenges() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<ChallengeNode | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [arriving, setArriving] = useState<string[]>([]);
  const [signal, setSignal] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const merge = useCallback((incoming: ChallengeRow[]) => {
    setRows((prev) => {
      const byId = new Map(prev.map((r) => [r.id, r]));
      incoming.forEach((r) => byId.set(r.id, r));
      return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    });
  }, []);

  /** Announce a genuinely new signal from this session. */
  const announce = useCallback((row: ChallengeRow) => {
    setArriving((prev) => (prev.includes(row.id) ? prev : [...prev, row.id]));
    setSignal(row.title);
    window.setTimeout(() => setSignal(null), 5200);
  }, []);

  const load = useCallback(
    async (announceNew: boolean) => {
      try {
        const next = await getMapChallenges();
        if (announceNew && !firstLoad.current) {
          setRows((prev) => {
            const known = new Set(prev.map((r) => r.id));
            const fresh = next.find((r) => !known.has(r.id));
            if (fresh) announce(fresh);
            return prev;
          });
        }
        firstLoad.current = false;
        setRows(next);
        setLoaded(true);
      } catch (err) {
        console.error("[civicx] loading map challenges failed", err);
        setLoaded(true);
      }
    },
    [announce],
  );

  useEffect(() => {
    void load(false);

    const onCreated = () => void load(true);
    window.addEventListener(CHALLENGE_CREATED_EVENT, onCreated);

    const unsubscribe = subscribeToNewChallenges((row) => {
      if (!hasCoordinates(row)) return;
      merge([row]);
      announce(row);
    });

    return () => {
      window.removeEventListener(CHALLENGE_CREATED_EVENT, onCreated);
      unsubscribe();
    };
  }, [load, merge, announce]);

  const liveNodes = useMemo(() => rows.map((r, i) => toChallengeNode(r, i)), [rows]);

  /** Demo nodes fill the canvas only until real signals exist. */
  const demoNodes = liveNodes.length > 0 ? [] : nearbyChallenges;

  const nodes = useMemo(() => {
    const wanted = categoryFilters.find((f) => f.label === category)?.match ?? null;
    return [...liveNodes, ...demoNodes].filter(
      (n) =>
        (!wanted || n.category === wanted) &&
        (priority === "ALL" || n.priority === (priority as Priority)),
    );
  }, [liveNodes, demoNodes, category, priority]);

  return (
    <section id="nearby" className="scroll-mt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>CHALLENGES NEAR YOU</SectionLabel>
          <p className="mt-3 text-sm text-muted-foreground">
            Explore civic signals around your community.
          </p>
        </div>
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]"
            style={reduced ? {} : { animation: "pulse-node 2.4s ease-in-out infinite" }}
          />
          {liveNodes.length > 0
            ? `${liveNodes.length} LIVE CIVIC SIGNAL${liveNodes.length === 1 ? "" : "S"}`
            : loaded
              ? "DEMO DATA — NO LIVE SIGNALS YET"
              : "SYNCING NETWORK…"}
        </span>
      </Reveal>

      <Reveal delay={0.06} className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          {categoryFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setCategory(f.label)}
              className={
                category === f.label
                  ? "rounded-xl border border-cyan/45 bg-cyan/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-cyan"
                  : "rounded-xl border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:border-cyan/30 hover:text-foreground"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mono-label text-muted-foreground/80">PRIORITY</span>
          {priorityFilters.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={
                priority === p
                  ? "rounded-xl border border-violet/45 bg-violet/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-violet"
                  : "rounded-xl border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:border-violet/30 hover:text-foreground"
              }
            >
              {p}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-6">
        <div className="glass grid-floor relative overflow-hidden rounded-[1.75rem] p-4 sm:p-6">
          <AnimatePresence>
            {signal && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="glass-soft absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-2xl border border-cyan/35 px-4 py-2.5 text-center"
              >
                <span className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.2em] text-cyan">
                  <Radio className="h-3 w-3" />
                  SIGNAL DETECTED
                </span>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  NEW CIVIC MISSION — {signal.toUpperCase()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative h-[26rem] w-full sm:h-[30rem]">
            {nodes.length === 0 ? (
              <div className="grid h-full place-items-center">
                <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
                  NO SIGNALS MATCH THIS FILTER
                </p>
              </div>
            ) : (
              <NodeNetwork
                nodes={nodes}
                autoLink
                ambient
                showLabels={false}
                arriving={arriving}
                onSelect={setSelected}
              />
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nodes.slice(0, 6).map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelected(node)}
                className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-cyan/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <CategoryDot category={node.category} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{node.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {node.location}
                      {node.affected ? ` • ${node.affected}` : ""}
                    </span>
                  </span>
                </span>
                <PriorityChip priority={node.priority} />
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <ChallengePanel
        node={selected}
        onClose={() => setSelected(null)}
        onViewMission={(node) => {
          setSelected(null);
          setDetailId(node.id);
        }}
      />

      <MissionDetail challengeId={detailId} onClose={() => setDetailId(null)} />
    </section>
  );
}
