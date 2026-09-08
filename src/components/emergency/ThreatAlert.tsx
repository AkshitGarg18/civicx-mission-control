import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Crosshair, Info, MapPin, PhoneCall, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  AI_ADVISORY_NOTE,
  categoryMeta,
  contactForService,
  defaultRegionId,
  emergencyStatusLabel,
  emergencyStatusTone,
  regionById,
  serviceLabel,
  threatTone,
  type EmergencyContact,
} from "@/lib/emergency-data";
import {
  isPotentialEmergency,
  recordEmergencyEscalation,
  requestCurrentLocation,
  type ThreatAssessment,
} from "@/lib/emergency-service";
import { CallConfirmDialog } from "./CallConfirmDialog";
import { cn } from "@/lib/utils";

/**
 * Advisory threat readout for a report. It recommends a service and offers a
 * call action; it never places a call and never claims a confirmed emergency.
 */
export function ThreatAlert({
  threat,
  challengeId = null,
  canEscalate = false,
  regionId = defaultRegionId,
}: {
  threat: ThreatAssessment;
  challengeId?: string | null;
  /** Only the reporter may record that they started an escalation. */
  canEscalate?: boolean;
  regionId?: string;
}) {
  const reduced = useReducedMotion();
  const region = regionById(regionId);
  const recommended = contactForService(region, threat.service);
  const primary = region.contacts[0]!;
  const critical = isPotentialEmergency(threat);
  const meta = categoryMeta(threat.category);

  const [pending, setPending] = useState<EmergencyContact | null>(null);
  const [current, setCurrent] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(
    threat.status === "EMERGENCY_ESCALATION_INITIATED",
  );

  const confirmCall = (contact: EmergencyContact) => {
    setPending(null);
    if (!challengeId || !canEscalate) return;
    setEscalated(true);
    void recordEmergencyEscalation(challengeId, contact.number).catch((err) => {
      console.error("[civicx] escalation record failed", err);
    });
  };

  const useCurrentLocation = async () => {
    setLocationError(null);
    try {
      setCurrent(await requestCurrentLocation());
    } catch (err) {
      setCurrent(null);
      setLocationError(err instanceof Error ? err.message : "Location is unavailable.");
    }
  };

  if (!critical) {
    return (
      <div className="glass-soft mt-3 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan/35 bg-cyan/10">
            <Info className="h-4 w-4 text-cyan" />
          </span>
          <div className="min-w-0">
            <p className="mono-label text-muted-foreground">THREAT ANALYSIS</p>
            <p className="mt-2 text-sm text-foreground/85">
              <span
                className={cn(
                  "mr-2 inline-flex rounded-lg border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em]",
                  threatTone[threat.level],
                )}
              >
                {threat.level}
              </span>
              This does not appear to require emergency escalation. Continue through the normal
              CivicX challenge workflow.
            </p>
            {threat.reason && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{threat.reason}</p>
            )}
            <Link
              to="/emergency"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-cyan transition-colors hover:text-foreground"
            >
              VIEW EMERGENCY CONTACTS
            </Link>
            <p className="mt-3 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
              {AI_ADVISORY_NOTE.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="glass relative mt-3 overflow-hidden rounded-2xl border-destructive/50 bg-destructive/5 p-5"
      >
        <motion.span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-destructive"
          animate={reduced ? {} : { opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-destructive/50 bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-destructive">
              POTENTIAL EMERGENCY DETECTED
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Not a confirmed emergency. A human authority has not validated this report.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="THREAT">
            {meta ? meta.label : (threat.category ?? "Unclassified")}
          </Field>
          <Field label="SEVERITY">
            <span
              className={cn(
                "inline-flex rounded-lg border px-2 py-0.5 font-mono text-[10px] tracking-[0.16em]",
                threatTone[threat.level],
              )}
            >
              {threat.level}
            </span>
          </Field>
          <Field label="RECOMMENDED RESPONSE">
            {serviceLabel[recommended.id]} · {recommended.number}
          </Field>
          <Field label="REPORT STATUS">
            <span
              className={cn(
                "inline-flex rounded-lg border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em]",
                emergencyStatusTone[
                  escalated ? "EMERGENCY_ESCALATION_INITIATED" : threat.status
                ],
              )}
            >
              {
                emergencyStatusLabel[
                  escalated ? "EMERGENCY_ESCALATION_INITIATED" : threat.status
                ]
              }
            </span>
          </Field>
        </div>

        {threat.reason && (
          <div className="glass-soft mt-3 rounded-xl p-4">
            <p className="mono-label text-muted-foreground">REASON</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">{threat.reason}</p>
          </div>
        )}

        <div className="glass-soft mt-3 rounded-xl p-4">
          <p className="mono-label text-muted-foreground">LOCATION</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground/85">
            <MapPin className="h-3.5 w-3.5 text-cyan" />
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              REPORTED
            </span>
            {threat.locationName ?? "Not provided"}
            {threat.latitude !== null && threat.longitude !== null && (
              <span className="font-mono text-xs">
                {threat.latitude.toFixed(4)}, {threat.longitude.toFixed(4)}
              </span>
            )}
          </p>

          {current && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground/85">
              <Crosshair className="h-3.5 w-3.5 text-warn" />
              <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                CURRENT
              </span>
              <span className="font-mono text-xs">
                {current.lat.toFixed(4)}, {current.lng.toFixed(4)}
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={() => void useCurrentLocation()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Crosshair className="h-3.5 w-3.5" />
            USE MY CURRENT LOCATION
          </button>
          {locationError && (
            <p className="mt-2 text-xs text-warn">{locationError}</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Your location stays on this screen — read it out yourself when you speak to the
            operator.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setPending(primary)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/50 bg-destructive/15 px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/25"
          >
            <PhoneCall className="h-4 w-4" />
            CALL {primary.number}
          </button>
          {recommended.id !== primary.id && (
            <button
              type="button"
              onClick={() => setPending(recommended)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-warn/45 bg-warn/10 px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-warn transition-colors hover:bg-warn/20"
            >
              <TriangleAlert className="h-4 w-4" />
              CALL {recommended.number}
            </button>
          )}
          <Link
            to="/emergency"
            className="inline-flex items-center justify-center rounded-xl border border-border px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            VIEW EMERGENCY CONTACTS
          </Link>
        </div>

        {escalated && (
          <p className="mt-4 font-mono text-[10px] tracking-[0.14em] text-warn">
            EMERGENCY ESCALATION INITIATED BY YOU · CIVICX DID NOT PLACE THE CALL
          </p>
        )}

        <p className="mt-4 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
          {AI_ADVISORY_NOTE.toUpperCase()}
        </p>
      </motion.div>

      <CallConfirmDialog
        open={pending !== null}
        serviceName={pending ? pending.service : ""}
        number={pending ? pending.number : ""}
        onCancel={() => setPending(null)}
        {...(pending ? { onConfirm: () => confirmCall(pending) } : {})}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground/90">{children}</p>
    </div>
  );
}
