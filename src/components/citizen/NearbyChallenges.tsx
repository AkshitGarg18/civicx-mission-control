import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClientOnly } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { PriorityChip } from "@/components/civicx/StatusChip";
import {
  CHALLENGE_CREATED_EVENT,
  getMapChallenges,
  hasCoordinates,
  subscribeToNewChallenges,
  type ChallengeRow,
} from "@/lib/challenges-service";
import { MissionDetail } from "./MissionDetail";

const ChallengeMap = lazy(() => import("./ChallengeMap"));

const priorityFilters = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

/** Real geographic signal map fed by the citizen's stored challenges. */
export function NearbyChallenges() {
  const reduced = useReducedMotion() ?? false;
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [arriving, setArriving] = useState<string[]>([]);
  const [signal, setSignal] = useState<string | null>(null);
  const firstLoad = useRef(true);

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

    // realtime inserts still pass through RLS, so only permitted rows arrive
    const unsubscribe = subscribeToNewChallenges((row) => {
      if (!hasCoordinates(row)) return;
      setRows((prev) =>
        prev.some((r) => r.id === row.id)
          ? prev
          : [row, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      );
      announce(row);
    });

    // safety net in case the realtime socket drops
    const poll = window.setInterval(() => void load(true), 60_000);

    return () => {
      window.removeEventListener(CHALLENGE_CREATED_EVENT, onCreated);
      window.clearInterval(poll);
      unsubscribe();
    };
  }, [load, announce]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.category && set.add(r.category.toUpperCase()));
    return ["ALL", ...[...set].sort()];
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (category === "ALL" || (r.category ?? "").toUpperCase() === category) &&
          (priority === "ALL" || r.priority === priority),
      ),
    [rows, category, priority],
  );

  const onViewMission = useCallback((id: string) => setDetailId(id), []);

  return (
    <section id="nearby" className="scroll-mt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>CHALLENGES NEAR YOU</SectionLabel>
          <p className="mt-3 text-sm text-muted-foreground">
            Live civic signals plotted on the real map of your city.
          </p>
        </div>
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--signal)]"
            style={reduced ? {} : { animation: "pulse-node 2.4s ease-in-out infinite" }}
          />
          {rows.length > 0
            ? `${filtered.length} / ${rows.length} MAPPED SIGNAL${rows.length === 1 ? "" : "S"}`
            : loaded
              ? "NO MAPPED SIGNALS YET"
              : "SYNCING NETWORK…"}
        </span>
      </Reveal>

      <Reveal delay={0.06} className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={
                category === c
                  ? "rounded-xl border border-cyan/45 bg-cyan/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-cyan"
                  : "rounded-xl border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:border-cyan/30 hover:text-foreground"
              }
            >
              {c}
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
        <div className="glass relative overflow-hidden rounded-[1.75rem] p-3 sm:p-4">
          <AnimatePresence>
            {signal && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="glass-soft absolute left-1/2 top-6 z-40 -translate-x-1/2 rounded-2xl border border-cyan/35 px-4 py-2.5 text-center"
              >
                <span className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.2em] text-cyan">
                  <Radio className="h-3 w-3" />
                  CIVIC SIGNAL DETECTED
                </span>
                <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  {signal.toUpperCase()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-[24rem] w-full sm:h-[30rem] lg:h-[34rem]">
            <ClientOnly
              fallback={
                <div className="grid h-full place-items-center rounded-2xl border border-border/70">
                  <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                    LOADING TERRAIN…
                  </p>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="grid h-full place-items-center rounded-2xl border border-border/70">
                    <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
                      LOADING TERRAIN…
                    </p>
                  </div>
                }
              >
                <ChallengeMap
                  rows={filtered}
                  arriving={arriving}
                  reduced={reduced}
                  onViewMission={onViewMission}
                />
              </Suspense>
            </ClientOnly>
          </div>

          {filtered.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, 6).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setDetailId(row.id)}
                  className="glass-soft flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:border-cyan/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{row.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {row.location_name ?? "Location pending"}
                      {row.category ? ` • ${row.category}` : ""}
                    </span>
                  </span>
                  <PriorityChip priority={row.priority as never} />
                </button>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <MissionDetail challengeId={detailId} onClose={() => setDetailId(null)} />
    </section>
  );
}
