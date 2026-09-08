import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, PhoneCall, ShieldAlert } from "lucide-react";
import {
  AI_ADVISORY_NOTE,
  categoryMeta,
  defaultRegionId,
  emergencyRegions,
  emergencyStatusLabel,
  emergencyStatusTone,
  regionById,
  threatTone,
  type EmergencyContact,
} from "@/lib/emergency-data";
import { isPotentialEmergency, readThreat } from "@/lib/emergency-service";
import { getMyChallenges, type ChallengeRow } from "@/lib/challenges-service";
import { EmergencyContactCard } from "./EmergencyContactCard";
import { CallConfirmDialog } from "./CallConfirmDialog";
import { cn } from "@/lib/utils";

/**
 * Emergency Center — the verified contact directory plus any of the signed-in
 * person's own reports that the AI flagged. CivicX only ever hands a number to
 * the device; it never contacts an authority.
 */
export function EmergencyCenter() {
  const reduced = useReducedMotion();
  const [regionId, setRegionId] = useState(defaultRegionId);
  const [pending, setPending] = useState<EmergencyContact | null>(null);
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const region = regionById(regionId);
  const primary = region.contacts[0]!;

  useEffect(() => {
    getMyChallenges()
      .then(setRows)
      .catch((err) => console.error("[civicx] emergency reports failed", err))
      .finally(() => setLoaded(true));
  }, []);

  const flagged = useMemo(
    () =>
      rows
        .map((row) => ({ row, threat: readThreat(row) }))
        .filter((item) => isPotentialEmergency(item.threat) || item.threat.level === "HIGH"),
    [rows],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:py-12">
      <header>
        <Link
          to="/citizen"
          className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO MISSION CONTROL
        </Link>

        <div className="mt-5 flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-destructive/45 bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Emergency Center
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Verified emergency numbers for {region.country}, plus any of your reports the
              assistant flagged as a possible emergency. You always place the call yourself.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mono-label text-muted-foreground">LOCATION</span>
        {emergencyRegions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegionId(r.id)}
            className={cn(
              "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] transition-colors",
              r.id === regionId
                ? "border-cyan/40 bg-cyan/10 text-cyan"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {r.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* primary integrated number */}
      <motion.section
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative overflow-hidden rounded-[1.75rem] border-destructive/45 bg-destructive/5 p-6 sm:p-8"
      >
        <p className="mono-label text-destructive">PRIMARY EMERGENCY NUMBER</p>
        <p className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          {primary.number}
        </p>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">{primary.note}</p>
        <button
          type="button"
          onClick={() => setPending(primary)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/15 px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/25"
        >
          <PhoneCall className="h-4 w-4" />
          CALL {primary.number}
        </button>
      </motion.section>

      <section>
        <h2 className="mono-label text-muted-foreground">EMERGENCY CONTACTS</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {region.contacts.map((c) => (
            <EmergencyContactCard
              key={c.id}
              contact={c}
              onCall={setPending}
              highlight={c.id === "PRIMARY"}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mono-label text-muted-foreground">YOUR FLAGGED REPORTS</h2>
        {!loaded ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading your reports…</p>
        ) : flagged.length === 0 ? (
          <p className="glass-soft mt-4 rounded-2xl p-5 text-sm text-muted-foreground">
            None of your reports are currently flagged as a possible emergency.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {flagged.map(({ row, threat }) => {
              const meta = categoryMeta(threat.category);
              return (
                <li key={row.id} className="glass-soft rounded-2xl p-5">
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
                        {meta.emoji} {meta.label.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{row.title}</p>
                  {threat.reason && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {threat.reason}
                    </p>
                  )}
                  <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    {threat.locationName ?? "LOCATION NOT PROVIDED"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="glass-soft rounded-2xl p-5">
        <h2 className="mono-label text-muted-foreground">BEFORE YOU CALL</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Move to a safe place first, away from fire, smoke, gas or traffic.</li>
          <li>Have the location ready — a landmark works when you have no address.</li>
          <li>Say plainly what is happening, whether anyone is hurt, and how many people.</li>
          <li>Stay on the line until the operator tells you to hang up.</li>
        </ul>
        <p className="mt-4 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
          {AI_ADVISORY_NOTE.toUpperCase()} · CIVICX NEVER CONTACTS AUTHORITIES FOR YOU.
        </p>
      </section>

      <CallConfirmDialog
        open={pending !== null}
        serviceName={pending ? pending.service : ""}
        number={pending ? pending.number : ""}
        onCancel={() => setPending(null)}
        onConfirm={() => setPending(null)}
      />
    </div>
  );
}
