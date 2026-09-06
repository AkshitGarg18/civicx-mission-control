import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Radio } from "lucide-react";
import { Counter } from "@/components/civicx/Counter";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { collaborationStatusMeta, type CollaborationStatus } from "@/lib/industry-data";
import { matchScore, type CollaborationEntry, type Opportunity, type ProfileRow } from "@/lib/industry-service";

const relative = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
};

/** Live readout of the industry pipeline. Every number comes from stored data. */
export function CommandCenter({
  opportunities,
  collaborations,
  profile,
  loaded,
  onOpenOpportunity,
  onOpenSection,
}: {
  opportunities: Opportunity[];
  collaborations: CollaborationEntry[];
  profile: ProfileRow | null;
  loaded: boolean;
  onOpenOpportunity: (proposalId: string) => void;
  onOpenSection: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const open = opportunities.filter((o) => !o.mine);
  const active = collaborations.filter(
    (c) => c.collaboration.status === "ACTIVE" || c.collaboration.status === "UNDER_DISCUSSION",
  );
  const completed = collaborations.filter((c) => c.collaboration.status === "COMPLETED");
  const reachable = collaborations.reduce(
    (sum, c) => sum + (c.mission?.estimated_impact ?? 0),
    0,
  );

  const strongMatches = profile
    ? opportunities.filter((o) => (matchScore(o, profile)?.percent ?? 0) >= 50).length
    : null;

  const cards: { label: string; value: number | null; caption: string; accent: string }[] = [
    {
      label: "OPEN OPPORTUNITIES",
      value: loaded ? open.length : null,
      caption: "Reviewed solutions you have not engaged with yet",
      accent: "text-warn",
    },
    {
      label: "ACTIVE COLLABORATIONS",
      value: loaded ? active.length : null,
      caption: "Discussions and committed support in progress",
      accent: "text-signal",
    },
    {
      label: "CITIZENS REACHABLE",
      value: loaded ? reachable : null,
      caption: "Estimated people affected by missions you back",
      accent: "text-cyan",
    },
    {
      label: "STRONG CAPABILITY MATCHES",
      value: loaded ? strongMatches : null,
      caption:
        strongMatches === null
          ? "Complete your organisation profile to unlock matching"
          : "Solutions with 50%+ overlap with your capabilities",
      accent: "text-violet",
    },
  ];

  const feed = [...opportunities]
    .sort(
      (a, b) =>
        new Date(b.proposal.submitted_at ?? b.proposal.created_at).getTime() -
        new Date(a.proposal.submitted_at ?? a.proposal.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <section className="space-y-8">
      <Reveal>
        <SectionLabel>COMMAND CENTER</SectionLabel>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-2xl p-5"
          >
            <p className="mono-label text-muted-foreground">{card.label}</p>
            <p className={`mt-3 text-2xl font-semibold tracking-tight ${card.accent}`}>
              {card.value === null ? "—" : <Counter value={card.value} />}
            </p>
            <p className="mt-2 text-xs leading-snug text-muted-foreground">{card.caption}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl p-5">
          <p className="mono-label inline-flex items-center gap-2 text-warn/90">
            <Radio className="h-3.5 w-3.5" />
            LATEST REVIEWED SOLUTIONS
          </p>

          {loaded && feed.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No university solution has completed its AI feasibility review yet. This feed
              fills as reviews finish.
            </p>
          )}

          <div className="mt-4 space-y-3">
            {feed.map((o) => (
              <button
                key={o.proposal.id}
                type="button"
                onClick={() => onOpenOpportunity(o.proposal.id)}
                className="glass-soft flex w-full items-center justify-between gap-4 rounded-xl p-3.5 text-left transition-colors hover:border-warn/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {o.mission?.title ?? "Mission unavailable"}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    {o.team?.team_name ?? "Team unavailable"} ·{" "}
                    {relative(o.proposal.submitted_at ?? o.proposal.created_at).toUpperCase()}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-warn" />
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="mono-label text-muted-foreground">YOUR PIPELINE</p>
          <div className="mt-4 space-y-3">
            {(
              [
                "INTEREST_EXPRESSED",
                "UNDER_DISCUSSION",
                "ACTIVE",
                "COMPLETED",
              ] as CollaborationStatus[]
            ).map((status) => {
              const count = collaborations.filter(
                (c) => c.collaboration.status === status,
              ).length;
              const meta = collaborationStatusMeta[status];
              return (
                <div
                  key={status}
                  className="glass-soft flex items-center justify-between rounded-xl p-3.5"
                >
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    {meta.label}
                  </span>
                  <span className="text-sm font-semibold">{loaded ? count : "—"}</span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOpenSection(completed.length > 0 ? "impact" : "opportunities")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-warn/40 bg-warn/10 px-3.5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-warn transition-colors hover:border-warn/70"
          >
            {completed.length > 0 ? "VIEW IMPACT" : "FIND OPPORTUNITIES"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
