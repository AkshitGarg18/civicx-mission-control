/**
 * CivicX team formation data layer.
 *
 * Every call runs with the signed-in user's session, so the Row Level Security
 * policies decide what is readable and writable. Matching and coverage are
 * plain, explainable arithmetic over stored skills — never generated numbers.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];

export const MIN_TEAM_SIZE = 2;
export const MAX_TEAM_SIZE = 6;

/** Public-safe view of a university profile used for team discovery. */
export interface StudentProfile {
  id: string;
  name: string | null;
  institution: string | null;
  course: string | null;
  year: string | null;
  skills: string[];
}

export interface StudentMatch extends StudentProfile {
  /** 0-100, or null when the mission has no recommended skills. */
  matchPercent: number | null;
  matchingSkills: string[];
}

const normalise = (s: string) => s.trim().toLowerCase();

/** True when two skill labels describe the same skill. */
function sameSkill(a: string, b: string): boolean {
  const x = normalise(a);
  const y = normalise(b);
  return x === y || x.includes(y) || y.includes(x);
}

/**
 * Skill match = matching recommended skills / total recommended skills × 100.
 * Returns null when the mission has no recommended skills at all.
 */
export function scoreStudent(
  student: StudentProfile,
  recommended: string[] | null,
): StudentMatch {
  const req = (recommended ?? []).filter((s) => s.trim().length > 0);
  if (req.length === 0) {
    return { ...student, matchPercent: null, matchingSkills: [] };
  }
  const matchingSkills = req.filter((r) => student.skills.some((s) => sameSkill(s, r)));
  return {
    ...student,
    matchingSkills,
    matchPercent: Math.round((matchingSkills.length / req.length) * 100),
  };
}

export interface Coverage {
  /** Each recommended skill and whether the selected members cover it. */
  items: Array<{ skill: string; covered: boolean }>;
  percent: number | null;
  missing: string[];
}

/** Team coverage = recommended skills present in the team / total × 100. */
export function teamCoverage(
  members: Array<{ skills: string[] }>,
  recommended: string[] | null,
): Coverage {
  const req = (recommended ?? []).filter((s) => s.trim().length > 0);
  if (req.length === 0) return { items: [], percent: null, missing: [] };

  const pool = members.flatMap((m) => m.skills);
  const items = req.map((skill) => ({
    skill,
    covered: pool.some((s) => sameSkill(s, skill)),
  }));
  const covered = items.filter((i) => i.covered).length;
  return {
    items,
    percent: Math.round((covered / req.length) * 100),
    missing: items.filter((i) => !i.covered).map((i) => i.skill),
  };
}

/**
 * Contribution area inferred from a member's own skills matched against the
 * mission requirements. Deterministic, not a prediction.
 */
export function contributionArea(matching: string[], skills: string[]): string {
  const source = matching.length > 0 ? matching : skills;
  if (source.length === 0) return "General mission support";
  return source.slice(0, 2).join(" · ");
}

/* ---------- reads ---------- */

/**
 * University profiles that this account is allowed to discover. Citizen
 * profiles are never returned — the RLS policy only exposes university rows.
 */
export async function getDiscoverableStudents(): Promise<StudentProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, institution, course, year, skills")
    .eq("role", "university");

  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    institution: p.institution,
    course: p.course,
    year: p.year,
    skills: p.skills ?? [],
  }));
}

export interface TeamWithMembers {
  team: TeamRow;
  members: Array<TeamMemberRow & { profile: StudentProfile | null }>;
}

/** Teams the signed-in user owns or belongs to, newest first. */
export async function getMyTeams(): Promise<TeamWithMembers[]> {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!teams || teams.length === 0) return [];

  const ids = teams.map((t) => t.id);
  const [{ data: members }, { data: profiles }] = await Promise.all([
    supabase.from("team_members").select("*").in("team_id", ids),
    supabase.from("profiles").select("id, name, institution, course, year, skills"),
  ]);

  const byId = new Map<string, StudentProfile>();
  for (const p of profiles ?? []) {
    byId.set(p.id, {
      id: p.id,
      name: p.name,
      institution: p.institution,
      course: p.course,
      year: p.year,
      skills: p.skills ?? [],
    });
  }

  return teams.map((team) => ({
    team,
    members: (members ?? [])
      .filter((m) => m.team_id === team.id)
      .map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null })),
  }));
}

export async function getTeamById(id: string): Promise<TeamWithMembers | null> {
  const all = await getMyTeams();
  return all.find((t) => t.team.id === id) ?? null;
}

/** Teams already created for a mission by this account. */
export async function getTeamsForMission(missionId: string): Promise<TeamRow[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("mission_id", missionId);
  if (error) throw error;
  return data ?? [];
}

/* ---------- writes ---------- */

export interface CreateTeamInput {
  missionId: string;
  teamName: string;
  leaderId: string;
  members: Array<{ userId: string; contributionArea: string }>;
  skillCoverage: number | null;
}

/**
 * Creates the team row, then its members. The database trigger advances the
 * mission status and writes the status-history entry.
 */
export async function createMissionTeam(input: CreateTeamInput): Promise<TeamRow> {
  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      mission_id: input.missionId,
      created_by: input.leaderId,
      team_name: input.teamName,
      status: "TEAM_FORMED",
      skill_coverage: input.skillCoverage,
    })
    .select()
    .single();

  if (error) throw error;

  const rows = input.members.map((m) => ({
    team_id: team.id,
    user_id: m.userId,
    is_leader: m.userId === input.leaderId,
    contribution_area: m.contributionArea,
  }));

  const inserted = await supabase.from("team_members").insert(rows);
  if (inserted.error) {
    console.error("[civicx] team member insert failed", inserted.error);
    throw inserted.error;
  }

  return team;
}
