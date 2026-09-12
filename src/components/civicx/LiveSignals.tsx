import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { signalFeed, type Signal } from "@/lib/civicx-data";

interface FeedItem extends Signal {
  key: number;
  time: string;
}

const clock = (offsetSeconds: number) => {
  const d = new Date(Date.now() - offsetSeconds * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

const tone: Record<string, string> = {
  "SIGNAL DETECTED": "text-warn",
  "AI ANALYSIS COMPLETE": "text-violet",
  "MATCHING IN PROGRESS": "text-azure",
  "TEAM FOUND": "text-cyan",
  "INDUSTRY SUPPORT AVAILABLE": "text-cyan",
  "MISSION ACTIVE": "text-signal",
  "MISSION COMPLETED": "text-signal",
};

/** Mission-control activity feed. New demo signals animate in over time. */
export function LiveSignals() {
  const reduced = useReducedMotion();
  const [items, setItems] = useState<FeedItem[]>(() =>
    signalFeed.slice(0, 5).map((s, i) => ({ ...s, key: i, time: "--:--:--" })),
  );

  useEffect(() => {
    setItems((current) => current.map((item, i) => ({ ...item, time: clock(i * 47) })));
    if (reduced) return;
    let n = signalFeed.length;
    const id = window.setInterval(() => {
      const next = signalFeed[n % signalFeed.length]!;
      n += 1;
      setItems((prev) => [{ ...next, key: n, time: clock(0) }, ...prev].slice(0, 5));
    }, 4200);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="glass flex h-full flex-col rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="mono-label text-cyan/85">Live Signals</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-signal/90">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          STREAMING
        </span>
      </div>

      <ul className="mt-4 flex-1 space-y-2.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.key}
              layout
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass-soft rounded-2xl px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex min-w-0 items-center gap-2 font-mono text-[10px] tracking-[0.14em] ${tone[item.kind] ?? "text-cyan"}`}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                  <span className="truncate">{item.kind}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                  {item.time}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                {item.detail}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/60">
        DEMO SIGNAL STREAM — PROTOTYPE DATA
      </p>
    </div>
  );
}
