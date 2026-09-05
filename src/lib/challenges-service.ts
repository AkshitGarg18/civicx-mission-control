/**
 * CivicX data layer.
 *
 * All database access for challenges goes through this module so components
 * never talk to the backend directly. While authentication is not implemented,
 * writes and reads are only attempted when a session exists; otherwise the
 * caller falls back to the demo data in `citizen-data.ts` (see `demo-user.ts`).
 */

import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/demo-user";
import type { Database } from "@/integrations/supabase/types";
import type { MissionStatus, Priority } from "@/lib/civicx-data";
import type { CitizenMission } from "@/lib/citizen-data";

export type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengeStatusRow =
  Database["public"]["Tables"]["challenge_status_history"]["Row"];
export type EvidenceRow = Database["public"]["Tables"]["challenge_evidence"]["Row"];

export interface NewChallenge {
  title: string;
  description: string;
  category: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  priority?: string;
  aiConfidence?: number | null;
  estimatedImpact?: number | null;
  aiSummary?: string | null;
  recommendedSkills?: string[] | null;
}

/** Insert a challenge for the signed-in citizen. Returns null in demo mode. */
export async function createChallenge(input: NewChallenge): Promise<ChallengeRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

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
      priority: input.priority ?? "MEDIUM",
      status: "REPORTED",
      ai_confidence: input.aiConfidence ?? null,
      estimated_impact: input.estimatedImpact ?? null,
      ai_summary: input.aiSummary ?? null,
      recommended_skills: input.recommendedSkills ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("challenge_status_history")
    .insert({ challenge_id: data.id, status: "REPORTED", message: "Signal received." });

  return data;
}

/** All challenges the current session is allowed to read. */
export async function getChallenges(): Promise<ChallengeRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Challenges reported by the current citizen. */
export async function getMyChallenges(): Promise<ChallengeRow[]> {
  const userId = await getCurrentUserId();
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
  const userId = await getCurrentUserId();
  if (!userId) return null;

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
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("challenge_status_history")
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
