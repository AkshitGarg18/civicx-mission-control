import { motion } from "motion/react";
import { civicStats, countBy, type Distribution, type MissionRecord } from "@/lib/government-service";
import { collaborationPipeline } from "@/lib/government-data";

function Bars({ title, data, tone }: { title: string; data: Distribution[]; tone: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="glass rounded-2xl p-5">
      <p className="mono-label text-muted-foreground">{title}</p>
      {data.length === 0 ? (
        <p className="mt-4 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          NO DATA RECORDED YET
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.map((row, i) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-xs text-foreground/90">{row.label}</span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {row.value}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.value / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${tone}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Civic analytics computed live from stored records. Impact figures the
 * platform cannot yet evidence are labelled instead of estimated.
 */
export function AnalyticsPanel({ missions }: { missions: MissionRecord[] }) {
  const stats = civicStats(missions);
  const byCategory = countBy(missions, (m) => m.challenge.category ?? "Uncategorised");
  const byPriority = countBy(missions, (m) => m.challenge.priority);
  const byLocation = countBy(missions, (m) => m.challenge.location_name).slice(0, 8);
  const byStage = countBy(missions, (m) => m.challenge.status.replace(/_/g, " "));

  const collaborationCounts = collaborationPipeline.map((stage) => ({
    label: stage.label,
    value: missions.reduce(
      (n, m) => n + m.collaborations.filter((c) => c.row.status === stage.id).length,
      0,
    ),
  }));

  const solutionRate =
    stats.totalChallenges === 0
      ? 0
      : Math.round((stats.activeMissions / stats.totalChallenges) * 100);
  const reviewedRate =
    stats.totalChallenges === 0
      ? 0
      : Math.round((missions.filter((m) => m.review).length / stats.totalChallenges) * 100);

  return (
    <section className="space-y-6">
      <div>
        <p className="mono-label text-muted-foreground">CIVIC INTELLIGENCE</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">ANALYTICS</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregated from the real civic record — no projections or sample data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="mono-label text-muted-foreground">CHALLENGES BEING SOLVED</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{solutionRate}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.activeMissions} of {stats.totalChallenges} have university or industry activity
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="mono-label text-muted-foreground">SOLUTIONS AI-REVIEWED</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{reviewedRate}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Feasibility reviews stored against submitted proposals
          </p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="mono-label text-muted-foreground">COMPLETED COLLABORATIONS</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{stats.resolvedMissions}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Confirmed complete by the university team
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bars title="CHALLENGES BY CATEGORY" data={byCategory} tone="bg-cyan" />
        <Bars title="CHALLENGES BY PRIORITY" data={byPriority} tone="bg-warn" />
        <Bars title="TOP LOCATIONS" data={byLocation} tone="bg-azure" />
        <Bars title="LIFECYCLE DISTRIBUTION" data={byStage} tone="bg-violet" />
        <Bars
          title="INDUSTRY COLLABORATION PIPELINE"
          data={collaborationCounts}
          tone="bg-signal"
        />
        <div className="glass rounded-2xl p-5">
          <p className="mono-label text-muted-foreground">IMPACT MEASUREMENT</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Verified real-world impact — citizens served, resources saved and outcome
            evidence — needs implementation reporting from the field. CivicX does not
            record it yet, so this console shows it as pending rather than estimating it.
          </p>
          <p className="mt-4 inline-flex rounded-xl border border-dashed border-border px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
            IMPLEMENTATION &amp; IMPACT TRACKING — NOT YET TRACKED
          </p>
        </div>
      </div>
    </section>
  );
}
