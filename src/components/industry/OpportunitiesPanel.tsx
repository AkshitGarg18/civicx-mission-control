import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Compass, Search } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { OpportunityCard } from "./OpportunityCard";
import {
  opportunitySortOptions,
  type OpportunitySort,
} from "@/lib/industry-data";
import { categoryFilters, priorityFilters, priorityRank } from "@/lib/university-data";
import type { Opportunity, ProfileRow } from "@/lib/industry-service";
import { cn } from "@/lib/utils";

const feasibilityRank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

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
        "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors",
        active
          ? "border-warn/50 bg-warn/10 text-warn"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Searchable feed of every reviewed solution open to industry support. */
export function OpportunitiesPanel({
  opportunities,
  profile,
  loaded,
  onView,
}: {
  opportunities: Opportunity[];
  profile: ProfileRow | null;
  loaded: boolean;
  onView: (proposalId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<OpportunitySort>("newest");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = opportunities.filter((o) => {
      const mission = o.mission;
      if (priority !== "ALL" && (mission?.priority ?? "MEDIUM") !== priority) return false;
      if (
        category !== "ALL" &&
        (mission?.category ?? "").toUpperCase() !== category.toUpperCase()
      )
        return false;
      if (!q) return true;
      return [
        mission?.title,
        mission?.location_name,
        mission?.category,
        o.proposal.proposed_solution,
        o.team?.team_name,
        o.university?.institution,
        ...(o.proposal.technologies ?? []),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    return [...list].sort((a, b) => {
      if (sort === "impact") {
        return (b.mission?.estimated_impact ?? 0) - (a.mission?.estimated_impact ?? 0);
      }
      if (sort === "feasibility") {
        const diff =
          (feasibilityRank[b.review.technical_feasibility] ?? 0) -
          (feasibilityRank[a.review.technical_feasibility] ?? 0);
        if (diff !== 0) return diff;
        return (
          priorityRank[b.mission?.priority ?? "MEDIUM"] -
          priorityRank[a.mission?.priority ?? "MEDIUM"]
        );
      }
      return (
        new Date(b.proposal.submitted_at ?? b.proposal.created_at).getTime() -
        new Date(a.proposal.submitted_at ?? a.proposal.created_at).getTime()
      );
    });
  }, [opportunities, query, priority, category, sort]);

  return (
    <section className="space-y-6">
      <Reveal>
        <SectionLabel>SOLUTION OPPORTUNITIES</SectionLabel>
        <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          Reviewed solutions ready for acceleration
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every solution here was proposed by a university team and passed the CivicX AI
          feasibility review. Nothing unfinished is visible to industry partners.
        </p>
      </Reveal>

      <div className="glass rounded-2xl p-4 sm:p-5">
        <label className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by mission, technology, team or university"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {priorityFilters.map((p) => (
              <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>
                {p}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {opportunitySortOptions.map((s) => (
              <Chip key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>
                {s.label.toUpperCase()}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {!loaded && (
        <p className="mono-label text-muted-foreground">SCANNING SOLUTION NETWORK…</p>
      )}

      {loaded && visible.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass grid-floor rounded-2xl px-6 py-16 text-center"
        >
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-warn/40 bg-warn/10 text-warn">
            <Compass className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="mono-label mt-6 text-warn/90">NO OPPORTUNITIES MATCH</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {opportunities.length === 0
              ? "No university solution has completed its AI feasibility review yet. New solutions appear here the moment a review finishes."
              : "No reviewed solution matches these filters. Try clearing the search or filters."}
          </p>
        </motion.div>
      )}

      {visible.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((o) => (
            <OpportunityCard
              key={o.proposal.id}
              opportunity={o}
              profile={profile}
              onView={onView}
            />
          ))}
        </div>
      )}
    </section>
  );
}
