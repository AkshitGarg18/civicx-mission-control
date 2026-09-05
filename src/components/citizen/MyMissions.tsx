import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { MissionProgress } from "@/components/civicx/MissionProgress";
import { PriorityChip, StatusChip } from "@/components/civicx/StatusChip";
import { statusStage } from "@/lib/civicx-data";
import { myMissions, type CitizenMission } from "@/lib/citizen-data";
import {
  CHALLENGE_CREATED_EVENT,
  getMyChallenges,
  toCitizenMission,
} from "@/lib/challenges-service";
import { MissionDetail } from "./MissionDetail";




function MissionRow({
  mission,
  index,
  onView,
}: {
  mission: CitizenMission;
  index: number;
  onView?: (() => void) | undefined;
}) {

  const reduced = useReducedMotion();

  return (
    <Reveal delay={0.06 * index}>
      <motion.article
        whileHover={reduced ? {} : { y: -4 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="glass border-flow group relative overflow-hidden rounded-2xl p-5 motion-reduce:transform-none sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mono-label text-cyan/90">{mission.code}</p>
            <h3 className="mt-2 text-base font-semibold tracking-tight sm:text-lg">
              {mission.title}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {mission.location}
              <span className="text-muted-foreground/50">•</span>
              reported {mission.reported}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PriorityChip priority={mission.priority} />
            <StatusChip status={mission.status} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border/70">
            <motion.span
              className="block h-full rounded-full"
              style={{ backgroundImage: "var(--gradient-accent)" }}
              initial={{ width: reduced ? `${mission.progress}%` : 0 }}
              whileInView={{ width: `${mission.progress}%` }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
            {mission.progress}%
          </span>
        </div>

        <MissionProgress activeStage={statusStage[mission.status]} className="mt-6" />

        <button
          type="button"
          onClick={onView}
          className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-cyan transition-colors hover:text-foreground"
        >
          VIEW MISSION
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.article>
    </Reveal>
  );
}

/** The citizen's own reported missions with lifecycle timelines. */
export function MyMissions() {
  const [live, setLive] = useState<CitizenMission[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    getMyChallenges()
      .then((rows) => {
        if (!cancelled) setLive(rows.map(toCitizenMission));
      })
      .catch((err) => {
        console.error("[civicx] loading missions failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = load();
    const onCreated = () => load();
    window.addEventListener(CHALLENGE_CREATED_EVENT, onCreated);
    return () => {
      cancel();
      window.removeEventListener(CHALLENGE_CREATED_EVENT, onCreated);
    };
  }, [load]);

  // Reported challenges first (newest first), demo missions stay as examples.
  const liveIds = new Set(live.map((m) => m.id));
  const missions = [...live, ...myMissions];

  return (
    <section id="missions" className="scroll-mt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>MY MISSIONS</SectionLabel>
          <p className="mt-3 text-sm text-muted-foreground">
            Every signal you sent, and exactly where it stands.
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          {missions.length} TRACKED
        </span>
      </Reveal>

      <div className="mt-6 grid gap-4">
        {missions.map((m, i) => (
          <MissionRow
            key={m.id}
            mission={m}
            index={i}
            onView={liveIds.has(m.id) ? () => setOpenId(m.id) : undefined}
          />
        ))}
      </div>

      <MissionDetail challengeId={openId} onClose={() => setOpenId(null)} />
    </section>
  );
}


