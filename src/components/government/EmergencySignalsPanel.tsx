import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MapPin, ShieldAlert } from "lucide-react";
import type { MissionRecord } from "@/lib/government-service";
import { isPotentialEmergency, readThreat } from "@/lib/emergency-service";
import {
  AI_ADVISORY_NOTE,
  categoryMeta,
  contactForService,
  emergencyStatusLabel,
  emergencyStatusTone,
  regionById,
  serviceLabel,
  threatTone,
} from "@/lib/emergency-data";
import { cn } from "@/lib/utils";

const severityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NORMAL: 0 } as const;

/**
 * Oversight view of AI-flagged emergency signals. Read-only, built from the
 * challenge records government already sees — no private citizen evidence.
 */
export function EmergencySignalsPanel({
  missions,
  loaded,
  onOpen,
}: {
  missions: MissionRecord[];
  loaded: boolean;
  onOpen: (challengeId: string) => void;
}) {
  const reduced = useReducedMotion();
  const region = regionById("IN");

  const signals = useMemo(
    () =>
      missions
        .map((m) => ({ mission: m, threat: readThreat(m.challenge) }))
        .filter((s) => isPotentialEmergency(s.threat) || s.threat.level === "HIGH")
        .sort((a, b) => severityRank[b.threat.level] - severityRank[a.threat.level]),
    [missions],
  );

  return (
    <section className="space-y-4">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-destructive/45 bg-destructive/10">
          <ShieldAlert className="h-4.5 w-4.5 text-destructive" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Emergency Signals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reports the AI flagged as a possible emergency. Advisory only — verify before acting.
          </p>
        </div>
      </header>

      {!loaded ? (
        <p className="glass-soft rounded-2xl p-5 text-sm text-muted-foreground">
          Loading civic record…
        </p>
      ) : signals.length === 0 ? (
        <p className="glass-soft rounded-2xl p-5 text-sm text-muted-foreground">
          No emergency signals in the current view.
        </p>
      ) : (
        <ul className="space-y-3">
          {signals.map(({ mission, threat }, i) => {
            const meta = categoryMeta(threat.category);
            const contact = contactForService(region, threat.service);
            return (
              <motion.li
                key={mission.challenge.id}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  type="button"
                  onClick={() => onOpen(mission.challenge.id)}
                  className="glass w-full rounded-2xl border-destructive/35 p-5 text-left transition-colors hover:border-destructive/60"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-lg border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em]",
                        threatTone[threat.level],
                      )}
                    >
                      {threat.level}
                    </span>
                    <span
                      className={cn(
                        "rounded-lg border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em]",
                        emergencyStatusTone[threat.status],
                      )}
                    >
                      {emergencyStatusLabel[threat.status]}
                    </span>
                    {meta && (
                      <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                        {meta.label.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm font-semibold">{mission.challenge.title}</p>
                  {threat.reason && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {threat.reason}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-cyan" />
                      {threat.locationName ?? "LOCATION NOT PROVIDED"}
                    </span>
                    <span>
                      SUGGESTED: {serviceLabel[contact.id].toUpperCase()} · {contact.number}
                    </span>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}

      <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
        {AI_ADVISORY_NOTE.toUpperCase()} · CIVICX DOES NOT DISPATCH OR CONTACT ANY AUTHORITY.
      </p>
    </section>
  );
}
