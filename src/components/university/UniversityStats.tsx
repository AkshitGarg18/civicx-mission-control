import { motion, useReducedMotion } from "motion/react";
import { Counter } from "@/components/civicx/Counter";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import type { ChallengeRow } from "@/lib/challenges-service";
import { scoreStudent, type TeamWithMembers } from "@/lib/teams-service";
import { useAuth } from "@/lib/auth-context";

interface StatCard {
  label: string;
  value: number | null;
  accent: string;
  caption: string;
}

/**
 * Four readouts derived only from data that actually exists. Anything that
 * depends on university-side records not built yet shows an em dash.
 */
export function UniversityStats({
  rows,
  loaded,
  teams,
}: {
  rows: ChallengeRow[];
  loaded: boolean;
  teams: TeamWithMembers[];
}) {
  const reduced = useReducedMotion();
  const { currentProfile } = useAuth();
  const mySkills = currentProfile?.skills ?? [];

  /** Missions where at least one recommended skill overlaps your own skills. */
  const matched =
    mySkills.length === 0
      ? null
      : rows.filter((r) => {
          const scored = scoreStudent(
            {
              id: "self",
              name: null,
              institution: null,
              course: null,
              year: null,
              bio: null,
              skills: mySkills,
            },
            r.recommended_skills,
          );
          return (scored.matchPercent ?? 0) > 0;
        }).length;

  const highImpact = rows.filter(
    (r) => r.priority === "HIGH" || r.priority === "CRITICAL",
  ).length;

  const stats: StatCard[] = [
    {
      label: "ACTIVE CIVIC CHALLENGES",
      value: loaded ? rows.length : null,
      accent: "var(--neon-cyan)",
      caption: "signals available to your university",
    },
    {
      label: "HIGH IMPACT MISSIONS",
      value: loaded ? highImpact : null,
      accent: "var(--warn)",
      caption: "high or critical priority",
    },
    {
      label: "MATCHED OPPORTUNITIES",
      value: loaded ? matched : null,
      accent: "var(--neon-violet)",
      caption:
        mySkills.length === 0
          ? "complete your skill profile to match missions"
          : "missions overlapping your skill profile",
    },
    {
      label: "MISSIONS IN PROGRESS",
      value: teams.length,
      accent: "var(--signal)",
      caption: "missions with a solution team",
    },
  ];

  return (
    <section className="scroll-mt-24">
      <Reveal>
        <SectionLabel>UNIVERSITY STATUS</SectionLabel>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={0.06 * i}>
            <motion.article
              whileHover={reduced ? {} : { y: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass border-flow group relative h-full overflow-hidden rounded-2xl p-5 motion-reduce:transform-none"
            >
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
                style={{ backgroundColor: stat.accent }}
              />
              <span
                className="absolute inset-x-5 top-0 h-px"
                style={{
                  backgroundImage: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)`,
                }}
              />
              <p className="mono-label text-muted-foreground">{stat.label}</p>
              <p
                className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: stat.accent }}
              >
                {stat.value === null ? "—" : <Counter value={stat.value} />}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{stat.caption}</p>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
