import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Radar, Search } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import type { ChallengeRow } from "@/lib/challenges-service";
import {
  categoryFilters,
  priorityFilters,
  priorityRank,
  sortOptions,
  statusFilters,
  type SortId,
} from "@/lib/university-data";
import { MissionCard } from "./MissionCard";
import { cn } from "@/lib/utils";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] transition-colors",
        active
          ? "border-azure/50 bg-azure/10 text-azure"
          : "border-border text-muted-foreground hover:border-azure/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Searchable, filterable board of real civic challenges. */
export function MissionBoard({
  rows,
  loaded,
  onView,
}: {
  rows: ChallengeRow[];
  loaded: boolean;
  onView: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [sort, setSort] = useState<SortId>("NEWEST");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statusEntry = statusFilters.find((s) => s.id === status);

    const filtered = rows.filter((row) => {
      if (q) {
        const haystack = [row.title, row.location_name ?? "", row.category ?? ""]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (priority !== "ALL") {
        if (priority === "HIGH") {
          if (row.priority !== "HIGH" && row.priority !== "CRITICAL") return false;
        } else if (row.priority !== priority) return false;
      }
      if (category !== "ALL") {
        const raw = (row.category ?? "").toLowerCase();
        if (category === "Other") {
          const known = categoryFilters
            .filter((c) => c !== "ALL" && c !== "Other")
            .map((c) => c.toLowerCase());
          if (known.some((k) => raw.includes(k))) return false;
        } else if (!raw.includes(category.toLowerCase())) return false;
      }
      if (statusEntry && statusEntry.match.length > 0) {
        if (!(statusEntry.match as readonly string[]).includes(row.status)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (sort === "NEWEST") {
      sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else if (sort === "IMPACT") {
      sorted.sort((a, b) => (b.estimated_impact ?? -1) - (a.estimated_impact ?? -1));
    } else {
      sorted.sort(
        (a, b) => (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0),
      );
    }
    return sorted;
  }, [rows, query, priority, category, status, sort]);

  return (
    <section id="mission-board" className="scroll-mt-24">
      <Reveal>
        <SectionLabel>ACTIVE CIVIC MISSIONS</SectionLabel>
        <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
          ACTIVE CIVIC MISSIONS
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Challenges reported by citizens and analyzed by CivicX AI.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="glass mt-6 space-y-4 rounded-2xl p-4 sm:p-5">
          <label className="block">
            <span className="mono-label text-muted-foreground">SEARCH MISSIONS</span>
            <span className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-background/40 px-3 py-2.5 focus-within:border-azure/50">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, location or category"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </span>
          </label>

          <div className="space-y-3">
            <FilterRow label="PRIORITY">
              {priorityFilters.map((p) => (
                <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>
                  {p === "ALL" ? "ALL" : p}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow label="CATEGORY">
              {categoryFilters.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c.toUpperCase()}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow label="STATUS">
              {statusFilters.map((s) => (
                <Chip key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>
                  {s.label.toUpperCase()}
                </Chip>
              ))}
            </FilterRow>

            <FilterRow label="SORT">
              {sortOptions.map((s) => (
                <Chip key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>
                  {s.label.toUpperCase()}
                </Chip>
              ))}
            </FilterRow>
          </div>
        </div>
      </Reveal>

      {!loaded ? (
        <p className="mono-label mt-8 text-muted-foreground">SCANNING CIVIC NETWORK…</p>
      ) : visible.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass grid-floor mt-8 rounded-2xl px-6 py-14 text-center"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-azure/40 bg-azure/10 text-azure">
            <Radar className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="mono-label mt-6 text-azure/90">NO CIVIC MISSIONS DETECTED</p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            New citizen challenges will appear here after AI analysis.
          </p>
        </motion.div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((row, i) => (
            <Reveal key={row.id} delay={Math.min(0.05 * i, 0.3)}>
              <MissionCard row={row} onView={onView} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mono-label w-full text-muted-foreground sm:w-20">{label}</span>
      {children}
    </div>
  );
}
