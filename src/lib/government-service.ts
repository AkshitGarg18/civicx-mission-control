/**
 * CivicX government data layer.
 *
 * Read-only oversight. Every query runs with the signed-in government session,
 * so the narrowly scoped government SELECT policies decide what is visible:
 * challenges, status history, teams, submitted proposals, AI reviews, industry
 * collaborations and participating organisation profiles. Private citizen
 * evidence and citizen profiles are never requested here.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ChallengeRow, ChallengeStatusRow } from "@/lib/challenges-service";
import {
  emptyFilters,
  statusGroups,
  type GovernmentFilters,
  type LifecycleStage,
  type LiveEventKind,
} from "@/lib/government-data";

export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
export type ProposalRow = Database["public"]["Tables"]["solution_proposals"]["Row"];
export type ProposalReviewRow = Database["public"]["Tables"]["proposal_reviews"]["Row"];
export type CollaborationRow =
  Database["public"]["Tables"]["industry_collaborations"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** One civic mission with everything government is allowed to see. */
export interface MissionRecord {
  challenge: ChallengeRow;
  team: TeamRow | null;
  teamSize: number;
  university: ProfileRow | null;
  proposal: ProposalRow | null;
  review: ProposalReviewRow | null;
  collaborations: { row: CollaborationRow; organization: ProfileRow | null }[];
  history: ChallengeStatusRow[];
}

export interface CivicOverview {
  missions: MissionRecord[];
  teams: TeamRow[];
  proposals: ProposalRow[];
  reviews: ProposalReviewRow[];
  collaborations: CollaborationRow[];
  organizations: Map<string, ProfileRow>;
}

export const emptyOverview: CivicOverview = {
  missions: [],
  teams: [],
  proposals: [],
  reviews: [],
  collaborations: [],
  organizations: new Map(),
};

async function optionalUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

const uniq = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v)));

/** Newest-first pick per key. */
function latestBy<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) if (!map.has(key(row))) map.set(key(row), row);
  return map;
}

/**
 * Loads the whole oversight picture in one pass. The platform-wide scale is
 * small enough that a handful of parallel reads is cheaper (and far easier to
 * reason about) than nested per-mission queries.
 */
export async function getCivicOverview(): Promise<CivicOverview> {
  if (!(await optionalUserId())) return emptyOverview;

  const [challenges, teams, proposals, reviews, collaborations, history, members] =
    await Promise.all([
      supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })
        .then(unwrap),
      supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false })
        .then(unwrap),
      supabase
        .from("solution_proposals")
        .select("*")
        .order("created_at", { ascending: false })
        .then(unwrap),
      supabase
        .from("proposal_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .then(unwrap),
      supabase
        .from("industry_collaborations")
        .select("*")
        .order("created_at", { ascending: false })
        .then(unwrap),
      supabase
        .from("challenge_status_history")
        .select("*")
        .order("created_at", { ascending: true })
        .then(unwrap),
      supabase.from("team_members").select("*").then(unwrap),
    ]);

  const orgIds = uniq([
    ...teams.map((t) => t.created_by),
    ...collaborations.map((c) => c.industry_user_id),
  ]);
  const organizations = new Map<string, ProfileRow>();
  if (orgIds.length > 0) {
    const rows = await supabase.from("profiles").select("*").in("id", orgIds).then(unwrap);
    for (const row of rows) organizations.set(row.id, row);
  }

  const teamByMission = latestBy(teams, (t) => t.mission_id);
  const proposalByMission = latestBy(proposals, (p) => p.mission_id);
  const reviewByProposal = latestBy(reviews, (r) => r.proposal_id);

  const memberCount = new Map<string, number>();
  for (const m of members) memberCount.set(m.team_id, (memberCount.get(m.team_id) ?? 0) + 1);

  const historyByChallenge = new Map<string, ChallengeStatusRow[]>();
  for (const h of history) {
    const list = historyByChallenge.get(h.challenge_id) ?? [];
    list.push(h);
    historyByChallenge.set(h.challenge_id, list);
  }

  const missions: MissionRecord[] = challenges.map((challenge) => {
    const team = teamByMission.get(challenge.id) ?? null;
    const proposal = proposalByMission.get(challenge.id) ?? null;
    return {
      challenge,
      team,
      teamSize: team ? memberCount.get(team.id) ?? 0 : 0,
      university: team ? organizations.get(team.created_by) ?? null : null,
      proposal,
      review: proposal ? reviewByProposal.get(proposal.id) ?? null : null,
      collaborations: collaborations
        .filter((c) => c.challenge_id === challenge.id)
        .map((row) => ({
          row,
          organization: organizations.get(row.industry_user_id) ?? null,
        })),
      history: historyByChallenge.get(challenge.id) ?? [],
    };
  });

  return { missions, teams, proposals, reviews, collaborations, organizations };
}

function unwrap<T>({ data, error }: { data: T[] | null; error: unknown }): T[] {
  if (error) throw error;
  return data ?? [];
}

/* ---------------- lifecycle ---------------- */

const untracked = "NOT YET TRACKED";

/**
 * The civic lifecycle for one mission, derived strictly from stored records.
 * Stages the backend cannot yet evidence are marked NOT YET TRACKED instead of
 * being shown as progress.
 */
export function buildLifecycle(mission: MissionRecord): LifecycleStage[] {
  const { challenge, team, proposal, review, collaborations } = mission;
  const status = challenge.status;
  const analysed = !!challenge.ai_summary || status !== "REPORTED";
  const collabStatuses = collaborations.map((c) => c.row.status);
  const has = (s: string) => collabStatuses.includes(s);

  const stages: LifecycleStage[] = [
    {
      id: "reported",
      label: "REPORTED",
      state: "done",
      detail: `Signal recorded ${formatDate(challenge.created_at)}`,
    },
    {
      id: "analysis",
      label: "AI ANALYSIS",
      state: analysed ? "done" : "pending",
      detail: analysed
        ? "AI analysis stored on the challenge record"
        : "No AI analysis stored yet",
    },
    {
      id: "team",
      label: "TEAM FORMED",
      state: team ? (team.status === "TEAM_FORMED" ? "done" : "current") : "pending",
      detail: team
        ? `${team.team_name} · ${team.status.replace(/_/g, " ")}`
        : "No university team assigned",
    },
    {
      id: "draft",
      label: "PROPOSAL DRAFT",
      state:
        proposal || status === "PROPOSAL_DRAFT"
          ? "done"
          : "pending",
      detail: proposal
        ? "Proposal record exists"
        : status === "PROPOSAL_DRAFT"
          ? "A team started drafting (draft content stays private)"
          : "No proposal started",
    },
    {
      id: "submitted",
      label: "PROPOSAL SUBMITTED",
      state: proposal && proposal.status !== "DRAFT" ? "done" : "pending",
      detail:
        proposal && proposal.submitted_at
          ? `Submitted ${formatDate(proposal.submitted_at)}`
          : "Not submitted yet",
    },
    {
      id: "review",
      label: "AI REVIEW",
      state: review
        ? "done"
        : proposal?.status === "UNDER_AI_REVIEW"
          ? "current"
          : "pending",
      detail: review ? "Feasibility review stored" : "No AI feasibility review stored",
    },
    {
      id: "ready",
      label: "READY FOR INDUSTRY REVIEW",
      state: proposal?.status === "AI_REVIEW_COMPLETE" && review ? "done" : "pending",
      detail:
        proposal?.status === "AI_REVIEW_COMPLETE" && review
          ? "Visible to industry organisations"
          : "Not yet eligible for industry review",
    },
    {
      id: "interest",
      label: "INDUSTRY INTEREST",
      state: collaborations.length > 0 ? "done" : "pending",
      detail:
        collaborations.length > 0
          ? `${collaborations.length} organisation${collaborations.length === 1 ? "" : "s"} engaged`
          : "No industry interest recorded",
    },
    {
      id: "collaboration",
      label: "COLLABORATION",
      state: has("ACTIVE") ? "done" : has("UNDER_DISCUSSION") ? "current" : "pending",
      detail: has("ACTIVE")
        ? "Support committed and active"
        : has("UNDER_DISCUSSION")
          ? "Discussions open"
          : "No active collaboration",
    },
    {
      id: "implementation",
      label: "IMPLEMENTATION",
      state: "untracked",
      detail: untracked,
    },
    {
      id: "impact",
      label: "IMPACT",
      state: has("COMPLETED") ? "done" : "untracked",
      detail: has("COMPLETED")
        ? "Collaboration marked completed by the university team"
        : untracked,
    },
  ];

  return stages;
}

/* ---------------- filtering ---------------- */

export function hasActiveFilters(filters: GovernmentFilters): boolean {
  return (
    filters.category !== emptyFilters.category ||
    filters.priority !== emptyFilters.priority ||
    filters.status !== emptyFilters.status ||
    filters.location.trim() !== "" ||
    filters.date !== emptyFilters.date ||
    filters.university !== emptyFilters.university ||
    filters.industry !== emptyFilters.industry
  );
}

export function applyFilters(
  missions: MissionRecord[],
  filters: GovernmentFilters,
): MissionRecord[] {
  const group = statusGroups.find((g) => g.id === filters.status);
  const cutoff = (() => {
    const days = Number(filters.date);
    if (!Number.isFinite(days) || days <= 0) return null;
    return Date.now() - days * 86_400_000;
  })();
  const location = filters.location.trim().toLowerCase();

  return missions.filter(({ challenge, team, collaborations }) => {
    if (filters.category !== "ALL" && (challenge.category ?? "") !== filters.category) {
      return false;
    }
    if (filters.priority !== "ALL" && challenge.priority !== filters.priority) return false;
    if (group && group.match.length > 0 && !group.match.includes(challenge.status)) {
      return false;
    }
    if (location && !(challenge.location_name ?? "").toLowerCase().includes(location)) {
      return false;
    }
    if (cutoff !== null && new Date(challenge.created_at).getTime() < cutoff) return false;
    if (filters.university === "YES" && !team) return false;
    if (filters.university === "NO" && team) return false;
    if (filters.industry === "YES" && collaborations.length === 0) return false;
    if (filters.industry === "NO" && collaborations.length > 0) return false;
    return true;
  });
}

/** Distinct stored categories, for the filter control. */
export function storedCategories(missions: MissionRecord[]): string[] {
  return uniq(missions.map((m) => m.challenge.category)).sort();
}

/* ---------------- statistics ---------------- */

export interface CivicStats {
  totalChallenges: number;
  activeMissions: number;
  universityTeams: number;
  industryCollaborations: number;
  resolvedMissions: number;
}

/** Real counts only. Nothing is inferred or padded. */
export function civicStats(missions: MissionRecord[]): CivicStats {
  const resolved = missions.filter((m) =>
    m.collaborations.some((c) => c.row.status === "COMPLETED"),
  ).length;
  return {
    totalChallenges: missions.length,
    activeMissions: missions.filter(
      (m) => m.team !== null || m.proposal !== null || m.collaborations.length > 0,
    ).length,
    universityTeams: new Set(missions.filter((m) => m.team).map((m) => m.team!.id)).size,
    industryCollaborations: missions.reduce((n, m) => n + m.collaborations.length, 0),
    resolvedMissions: resolved,
  };
}

export interface Distribution {
  label: string;
  value: number;
}

export function countBy(
  missions: MissionRecord[],
  pick: (m: MissionRecord) => string | null,
): Distribution[] {
  const counts = new Map<string, number>();
  for (const mission of missions) {
    const key = pick(mission);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/* ---------------- realtime oversight feed ---------------- */

export interface LiveEvent {
  id: string;
  kind: LiveEventKind;
  message: string;
  /** When the console received the event. */
  at: string;
}

/**
 * Subscribes to the civic pipeline tables. Payloads still pass through RLS, so
 * government only receives rows it is authorised to read.
 */
export function subscribeToCivicOperations(onEvent: (event: LiveEvent) => void) {
  const emit = (kind: LiveEvent["kind"], message: string) =>
    onEvent({
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      message,
      at: new Date().toISOString(),
    });

  const channel = supabase
    .channel("civicx-government-ops")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "challenges" },
      ({ new: row }) => emit("challenge", `New civic challenge reported: ${title(row)}.`),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "teams" },
      ({ new: row }) =>
        emit("team", `A university team was formed: ${String((row as TeamRow).team_name)}.`),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "solution_proposals" },
      () => emit("proposal", "A solution proposal entered the pipeline."),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "solution_proposals" },
      ({ new: row }) => {
        const status = String((row as ProposalRow).status);
        if (status === "SUBMITTED") emit("proposal", "A solution proposal was submitted.");
      },
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "proposal_reviews" },
      () => emit("review", "An AI feasibility review completed."),
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "industry_collaborations" },
      () => emit("interest", "Industry interest detected in a reviewed solution."),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "industry_collaborations" },
      ({ new: row }) =>
        emit(
          "collaboration",
          `Collaboration status is now ${String((row as CollaborationRow).status).replace(/_/g, " ")}.`,
        ),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

const title = (row: Record<string, unknown>) =>
  typeof row["title"] === "string" ? (row["title"] as string) : "Untitled signal";

/* ---------------- organisation profile ---------------- */

export interface GovernmentProfileEdit {
  name: string;
  institution: string;
  department: string | null;
  jurisdiction: string | null;
  bio: string | null;
  expertiseAreas: string[];
}

export async function getGovernmentProfile(): Promise<ProfileRow | null> {
  const userId = await optionalUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Saves the government organisation profile. `role` and `id` are never sent —
 * the database pins the role and the row is scoped to the signed-in user.
 */
export async function saveGovernmentProfile(
  edit: GovernmentProfileEdit,
): Promise<ProfileRow> {
  const userId = await optionalUserId();
  if (!userId) throw new Error("You need to be signed in to update your profile.");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: edit.name,
      institution: edit.institution,
      department: edit.department,
      jurisdiction: edit.jurisdiction,
      bio: edit.bio,
      expertise_areas: edit.expertiseAreas,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function parseList(raw: string): string[] {
  return uniq(
    raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
