import { SlidersHorizontal, X } from "lucide-react";
import {
  dateOptions,
  emptyFilters,
  involvementOptions,
  priorityOptions,
  statusGroups,
  type GovernmentFilters,
} from "@/lib/government-data";

const field =
  "w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-violet/50";

/** Global oversight filters. Applied to mission lists, the map and analytics. */
export function GovernmentFiltersBar({
  filters,
  categories,
  onChange,
  matched,
  total,
}: {
  filters: GovernmentFilters;
  categories: string[];
  onChange: (next: GovernmentFilters) => void;
  matched: number;
  total: number;
}) {
  const set = <K extends keyof GovernmentFilters>(key: K, value: GovernmentFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <section className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mono-label flex items-center gap-2 text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5 text-violet" />
          OVERSIGHT FILTERS
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
            {matched} / {total} MISSIONS
          </span>
          <button
            type="button"
            onClick={() => onChange(emptyFilters)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            RESET
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">CATEGORY</span>
          <select
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
            className={field}
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">PRIORITY</span>
          <select
            value={filters.priority}
            onChange={(e) => set("priority", e.target.value)}
            className={field}
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p === "ALL" ? "All priorities" : p}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">LIFECYCLE STATUS</span>
          <select
            value={filters.status}
            onChange={(e) => set("status", e.target.value)}
            className={field}
          >
            {statusGroups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">LOCATION</span>
          <input
            value={filters.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Search a ward, area or city"
            className={field}
          />
        </label>

        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">REPORTED</span>
          <select
            value={filters.date}
            onChange={(e) => set("date", e.target.value)}
            className={field}
          >
            {dateOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">UNIVERSITY</span>
          <select
            value={filters.university}
            onChange={(e) => set("university", e.target.value as GovernmentFilters["university"])}
            className={field}
          >
            {involvementOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="mono-label text-muted-foreground">INDUSTRY</span>
          <select
            value={filters.industry}
            onChange={(e) => set("industry", e.target.value as GovernmentFilters["industry"])}
            className={field}
          >
            {involvementOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
