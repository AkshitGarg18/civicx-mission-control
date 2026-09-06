import { motion } from "motion/react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileCheck2,
  Radar,
  Users,
} from "lucide-react";
import { liveEventLabels } from "@/lib/government-data";
import {
  civicStats,
  formatDateTime,
  type LiveEvent,
  type MissionRecord,
} from "@/lib/government-service";

/** Government overview. Every figure is counted from stored records. */
export function CommandCenterPanel({
  missions,
  events,
  loaded,
}: {
  missions: MissionRecord[];
  events: LiveEvent[];
  loaded: boolean;
}) {
  const stats = civicStats(missions);
  const aiReviewed = missions.filter((m) => m.review).length;
  const highPriorityOpen = missions.filter(
    (m) => (m.challenge.priority === "CRITICAL" || m.challenge.priority === "HIGH") && !m.team,
  ).length;

  const cards = [
    {
      label: "TOTAL CIVIC CHALLENGES",
      value: stats.totalChallenges,
      icon: Radar,
      tone: "text-cyan border-cyan/40",
      note: "Reported by citizens",
    },
    {
      label: "MISSIONS IN MOTION",
      value: stats.activeMissions,
      icon: Users,
      tone: "text-azure border-azure/40",
      note: "Team, proposal or industry activity",
    },
    {
      label: "UNIVERSITY TEAMS",
      value: stats.universityTeams,
      icon: Users,
      tone: "text-azure border-azure/40",
      note: "Teams formed on real missions",
    },
    {
      label: "AI-REVIEWED SOLUTIONS",
      value: aiReviewed,
      icon: FileCheck2,
      tone: "text-violet border-violet/40",
      note: "Feasibility review stored",
    },
    {
      label: "INDUSTRY COLLABORATIONS",
      value: stats.industryCollaborations,
      icon: Building2,
      tone: "text-warn border-warn/40",
      note: "Interest and active support",
    },
    {
      label: "COMPLETED COLLABORATIONS",
      value: stats.resolvedMissions,
      icon: CheckCircle2,
      tone: "text-signal border-signal/40",
      note: "Marked complete by teams",
    },
    {
      label: "HIGH-PRIORITY UNCLAIMED",
      value: highPriorityOpen,
      icon: AlertTriangle,
      tone: "text-destructive border-destructive/40",
      note: "Critical or high, no team yet",
    },
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="mono-label text-muted-foreground">GOVERNMENT COMMAND CENTER</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">CIVIC OVERVIEW</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="mono-label text-muted-foreground">{card.label}</p>
                <span className={`rounded-lg border p-1.5 ${card.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                {loaded ? card.value.toLocaleString() : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
            </motion.article>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="mono-label text-muted-foreground">LIVE CIVIC ACTIVITY</p>
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-signal">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            STREAMING
          </span>
        </div>

        {events.length === 0 ? (
          <p className="mt-4 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
            WATCHING FOR CIVIC ACTIVITY…
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {events.map((event, i) => (
              <motion.li
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.5) }}
                className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-violet">
                    {liveEventLabels[event.kind]}
                  </p>
                  <p className="truncate text-sm text-foreground/90">{event.message}</p>
                </div>
                <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
                  {formatDateTime(event.at)}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
