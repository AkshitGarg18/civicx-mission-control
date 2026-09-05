/**
 * CivicX data layer.
 *
 * All database access for challenges goes through this module so components
 * never talk to the backend directly. Every call uses the authenticated user's
 * session, so the existing Row Level Security policies apply unchanged.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { MissionStatus, Priority } from "@/lib/civicx-data";
import type { CitizenMission } from "@/lib/citizen-data";
import type { ChallengeAnalysis } from "@/lib/mock-analysis";

export type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengeStatusRow =
  Database["public"]["Tables"]["challenge_status_history"]["Row"];
export type EvidenceRow = Database["public"]["Tables"]["challenge_evidence"]["Row"];

export const EVIDENCE_BUCKET = "challenge-evidence";

/** Fired after a challenge is stored so open lists can refresh themselves. */
export const CHALLENGE_CREATED_EVENT = "civicx:challenge-created";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("You need to be signed in to report a challenge.");
    this.name = "NotAuthenticatedError";
  }
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new NotAuthenticatedError();
  return data.user.id;
}

async function optionalUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export interface NewChallenge {
  title: string;
  description: string;
  category: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Insert a challenge plus its first status-history entry. */
export async function createChallenge(input: NewChallenge): Promise<ChallengeRow> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      created_by: userId,
      title: input.title,
      description: input.description,
      category: input.category,
      location_name: input.locationName,
      latitude: input.latitude,
      longitude: input.longitude,
      priority: "MEDIUM",
      status: "REPORTED",
    })
    .select()
    .single();

  if (error) throw error;

  const history = await supabase
    .from("challenge_status_history")
    .insert({
      challenge_id: data.id,
      status: "REPORTED",
      message: "Challenge submitted by citizen",
    });

  if (history.error) throw history.error;

  return data;
}

/**
 * Writes the placeholder analysis onto the stored challenge so the database
 * holds a complete record. Replace the caller's analysis source with Gemini
 * output later — this function stays as is.
 */
export async function applyChallengeAnalysis(
  challengeId: string,
  analysis: ChallengeAnalysis,
): Promise<ChallengeRow> {
  await requireUserId();

  const { data, error } = await supabase
    .from("challenges")
    .update({
      category: analysis.category,
      priority: analysis.priority,
      ai_confidence: analysis.aiConfidence,
      estimated_impact: analysis.estimatedImpact,
      ai_summary: analysis.aiSummary,
      recommended_skills: analysis.recommendedSkills,
      status: "AI ANALYSIS",
    })
    .eq("id", challengeId)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("challenge_status_history").insert({
    challenge_id: challengeId,
    status: "AI ANALYSIS",
    message: "Automated analysis completed",
  });

  return data;
}

/** Upload each attached file, then record it against the challenge. */
export async function uploadChallengeEvidence(
  challengeId: string,
  files: File[],
): Promise<EvidenceRow[]> {
  if (files.length === 0) return [];
  const userId = await requireUserId();
  const rows: EvidenceRow[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${challengeId}/${Date.now()}-${safeName}`;

    const upload = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .upload(path, file, { contentType: file.type || "application/octet-stream" });

    if (upload.error) {
      console.error("[civicx] evidence upload failed", upload.error);
      throw new Error(`We could not upload "${file.name}".`);
    }

    const { data, error } = await supabase
      .from("challenge_evidence")
      .insert({
        challenge_id: challengeId,
        file_url: path,
        file_type: file.type || null,
        file_name: file.name,
      })
      .select()
      .single();

    if (error) {
      console.error("[civicx] evidence record failed", error);
      throw new Error(`We could not save the record for "${file.name}".`);
    }
    rows.push(data);
  }

  return rows;
}

/** Short-lived link for a private evidence object. */
export async function getEvidenceUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) {
    console.error("[civicx] signed url failed", error);
    return null;
  }
  return data.signedUrl;
}

/** All challenges the current session is allowed to read. */
export async function getChallenges(): Promise<ChallengeRow[]> {
  if (!(await optionalUserId())) return [];

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Challenges reported by the current citizen, newest first. */
export async function getMyChallenges(): Promise<ChallengeRow[]> {
  const userId = await optionalUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getChallengeById(id: string): Promise<ChallengeRow | null> {
  if (!(await optionalUserId())) return null;

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getChallengeStatusHistory(
  challengeId: string,
): Promise<ChallengeStatusRow[]> {
  if (!(await optionalUserId())) return [];

  const { data, error } = await supabase
    .from("challenge_status_history")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getChallengeEvidence(challengeId: string): Promise<EvidenceRow[]> {
  if (!(await optionalUserId())) return [];

  const { data, error } = await supabase
    .from("challenge_evidence")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/* ---------- presentation mapping (keeps the existing UI contract) ---------- */

const statusMap: Record<string, MissionStatus> = {
  REPORTED: "SIGNAL DETECTED",
  "AI ANALYSIS": "AI ANALYSIS COMPLETE",
  MATCHING: "MATCHING IN PROGRESS",
  COLLABORATION: "MISSION ACTIVE",
  IMPACT: "MISSION COMPLETED",
};

const progressMap: Record<MissionStatus, number> = {
  "SIGNAL DETECTED": 10,
  "AI ANALYSIS COMPLETE": 20,
  "MATCHING IN PROGRESS": 45,
  "TEAM FOUND": 60,
  "INDUSTRY SUPPORT AVAILABLE": 70,
  "MISSION ACTIVE": 85,
  "MISSION COMPLETED": 100,
};

function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** Map a database row onto the mission card shape the UI already renders. */
export function toCitizenMission(row: ChallengeRow): CitizenMission {
  const status = statusMap[row.status] ?? "SIGNAL DETECTED";
  return {
    id: row.id,
    code: `MISSION #${row.id.slice(0, 4).toUpperCase()}`,
    title: row.title,
    location: row.location_name ?? "Location pending",
    priority: (row.priority as Priority) ?? "MEDIUM",
    status,
    progress: progressMap[status],
    reported: relativeTime(row.created_at),
  };
}
