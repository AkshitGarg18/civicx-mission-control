/**
 * Emergency layer data access.
 *
 * Uses the signed-in session only, so the existing Row Level Security policies
 * decide what can be read or updated. Nothing here contacts an authority: an
 * escalation record is written only after the person confirms the call action.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ChallengeRow } from "@/lib/challenges-service";
import {
  toEmergencyStatus,
  toThreatLevel,
  type EmergencyService,
  type EmergencyStatus,
  type ThreatLevel,
} from "@/lib/emergency-data";

export interface ThreatAssessment {
  level: ThreatLevel;
  category: string | null;
  reason: string | null;
  service: EmergencyService | null;
  status: EmergencyStatus;
  escalatedAt: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Read the stored advisory assessment off a challenge row. */
export function readThreat(row: ChallengeRow): ThreatAssessment {
  const record = row as ChallengeRow & {
    threat_level?: string | null;
    threat_category?: string | null;
    threat_reason?: string | null;
    recommended_service?: string | null;
    emergency_status?: string | null;
    escalated_at?: string | null;
  };

  return {
    level: toThreatLevel(record.threat_level),
    category: record.threat_category ?? null,
    reason: record.threat_reason ?? null,
    service: (record.recommended_service as EmergencyService | null) ?? null,
    status: toEmergencyStatus(record.emergency_status),
    escalatedAt: record.escalated_at ?? null,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export function isPotentialEmergency(threat: ThreatAssessment): boolean {
  return (
    threat.level === "CRITICAL" ||
    threat.status === "POTENTIAL_EMERGENCY" ||
    threat.status === "EMERGENCY_ESCALATION_INITIATED"
  );
}

/**
 * Records that the reporter chose to contact emergency services. This does not
 * contact anyone — the device places the call.
 */
export async function recordEmergencyEscalation(
  challengeId: string,
  serviceNumber: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("challenges")
    .update({
      emergency_status: "EMERGENCY_ESCALATION_INITIATED",
      escalated_at: now,
    })
    .eq("id", challengeId);

  if (error) throw error;

  const history = await supabase.from("challenge_status_history").insert({
    challenge_id: challengeId,
    status: "EMERGENCY_ESCALATION_INITIATED",
    message: `Reporter opened the emergency call action for ${serviceNumber}. CivicX did not place the call.`,
  });
  if (history.error) throw history.error;
}

/** Ask the browser for the current position; never shared automatically. */
export function requestCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("This device cannot share a location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Location permission was not granted.")),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}
