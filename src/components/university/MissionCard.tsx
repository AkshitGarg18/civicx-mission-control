import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { PriorityChip, StatusChip } from "@/components/civicx/StatusChip";
import { statusMap, type ChallengeRow } from "@/lib/challenges-service";
import { categoryLabel } from "@/lib/university-data";
import { useAuth } from "@/lib/auth-context";
import { scoreStudent } from "@/lib/teams-service";


const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** One civic mission on the university board, rendered from a stored row. */
export function MissionCard({
  row,
  onView,
}: {
  row: ChallengeRow;
  onView: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const status = statusMap[row.status] ?? "SIGNAL DETECTED";
  const priority = (row.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW") ?? "MEDIUM";
  const skills = row.recommended_skills ?? [];

  return (
    <motion.article
      whileHover={reduced ? {} : { y: -6 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass border-flow group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 motion-reduce:transform-none"
    >
      <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-azure/20 opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />

      <div className="relative flex items-start justify-between gap-3">
        <PriorityChip priority={priority} />
        <StatusChip status={status} />
      </div>

      <h3 className="relative mt-4 text-base font-semibold leading-snug tracking-tight sm:text-lg">
        {row.title}
      </h3>

      <p className="relative mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
        <span className="text-azure">{categoryLabel(row.category).toUpperCase()}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {row.location_name ?? "Location pending"}
        </span>
      </p>

      <div className="glass-soft relative mt-4 rounded-xl p-3.5">
        <p className="mono-label text-muted-foreground">AI SUMMARY</p>
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground/85">
          {row.ai_summary ?? "AI analysis pending for this signal."}
        </p>
      </div>

      <div className="relative mt-3 grid gap-3 sm:grid-cols-2">
        <div className="glass-soft rounded-xl p-3.5">
          <p className="mono-label text-muted-foreground">ESTIMATED IMPACT</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-3.5 w-3.5 text-cyan" />
            {row.estimated_impact !== null
              ? `~${row.estimated_impact.toLocaleString("en-IN")} people`
              : "—"}
          </p>
        </div>
        <div className="glass-soft rounded-xl p-3.5">
          <p className="mono-label text-muted-foreground">AI MATCH</p>
          {mySkills.length === 0 ? (
            <>
              <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-violet">
                SKILL PROFILE INCOMPLETE
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Matching unavailable until skills are added.
              </p>
            </>
          ) : myMatch === null ? (
            <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-violet">
              MATCHING UNAVAILABLE
            </p>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold text-cyan">{myMatch}%</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Based on your saved skill profile.
              </p>
            </>
          )}
        </div>

      </div>

      {skills.length > 0 && (
        <div className="relative mt-3">
          <p className="mono-label text-muted-foreground">RECOMMENDED SKILLS</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="relative mt-5 flex items-center justify-between gap-3 pt-1">
        <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          REPORTED {formatDate(row.created_at).toUpperCase()}
        </span>
        <motion.button
          type="button"
          onClick={() => onView(row.id)}
          whileHover={reduced ? {} : { x: 3 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-xl border border-azure/40 bg-azure/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-azure transition-colors hover:border-azure/70 motion-reduce:transform-none"
        >
          VIEW MISSION
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.article>
  );
}
