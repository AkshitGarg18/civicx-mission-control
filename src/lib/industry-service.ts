/**
 * CivicX industry data layer.
 *
 * Everything an industry organisation reads or writes goes through here so the
 * components never touch the backend directly. Every call runs with the signed
 * in session, so the Row Level Security policies decide what is visible:
 * industry accounts only see proposals that finished the AI feasibility review,
 * and only ever see their own collaboration records.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ChallengeRow } from "@/lib/challenges-service";
import type { CollaborationStatus } from "@/lib/industry-data";

export type ProposalRow = Database["public"]["Tables"]["solution_proposals"]["Row"];
export type ProposalReviewRow = Database["public"]["Tables"]["proposal_reviews"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CollaborationRow =
  Database["public"]["Tables"]["industry_collaborations"]["Row"];

/** Fired after an interest record is stored so open lists can refresh. */
export const COLLABORATION_CREATED_EVENT = "civicx:collaboration-created";

/** One reviewed solution, with everything an organisation needs to judge it. */
export interface Opportunity {
  proposal: ProposalRow;
  review: ProposalReviewRow;
  team: TeamRow | null;
  mission: ChallengeRow | null;
  university: ProfileRow | null;
  /** The current organisation's own record against this proposal, if any. */
  mine: CollaborationRow | null;
  /** How many organisations have engaged — only counts records we may read. */
  interestCount: number;
}

/** A collaboration record joined with the mission it supports. */
export interface CollaborationEntry {
  collaboration: CollaborationRow;
  proposal: ProposalRow | null;
  review: ProposalReviewRow | null;
  team: TeamRow | null;
  mission: ChallengeRow | null;
  university: ProfileRow | null;
}

/** An industry signal shown to the university team that owns the proposal. */
export interface IndustrySignal {
  collaboration: CollaborationRow;
  organization: ProfileRow | null;
}

export class NotAuthenticatedError extends Error {
  constructor() {
    super("You need to be signed in to do that.");
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

const uniq = (values: (string | null | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v)));

async function fetchProposals(ids: string[]): Promise<Map<string, ProposalRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase
    .from("solution_proposals")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.id, r]));
}

async function fetchReviews(
  proposalIds: string[],
): Promise<Map<string, ProposalReviewRow>> {
  if (proposalIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("proposal_reviews")
    .select("*")
    .in("proposal_id", proposalIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const map = new Map<string, ProposalReviewRow>();
  for (const row of data ?? []) if (!map.has(row.proposal_id)) map.set(row.proposal_id, row);
  return map;
}

async function fetchTeams(ids: string[]): Promise<Map<string, TeamRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("teams").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.id, r]));
}

async function fetchMissions(ids: string[]): Promise<Map<string, ChallengeRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("challenges").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.id, r]));
}

async function fetchProfiles(ids: string[]): Promise<Map<string, ProfileRow>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.id, r]));
}

/**
 * Every reviewed solution proposal an industry account may evaluate. RLS keeps
 * drafts and unreviewed work invisible, so nothing unfinished can leak here.
 */
export async function getOpportunities(): Promise<Opportunity[]> {
  const userId = await optionalUserId();
  if (!userId) return [];

  const { data: proposals, error } = await supabase
    .from("solution_proposals")
    .select("*")
    .eq("status", "AI_REVIEW_COMPLETE")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = proposals ?? [];
  if (rows.length === 0) return [];

  const proposalIds = rows.map((p) => p.id);
  const [reviews, teams, missions, collaborations] = await Promise.all([
    fetchReviews(proposalIds),
    fetchTeams(uniq(rows.map((p) => p.team_id))),
    fetchMissions(uniq(rows.map((p) => p.mission_id))),
    supabase
      .from("industry_collaborations")
      .select("*")
      .in("proposal_id", proposalIds)
      .then(({ data, error: err }) => {
        if (err) throw err;
        return data ?? [];
      }),
  ]);

  const universities = await fetchProfiles(
    uniq(Array.from(teams.values()).map((t) => t.created_by)),
  );

  return rows
    .filter((p) => reviews.has(p.id))
    .map((proposal) => {
      const team = teams.get(proposal.team_id) ?? null;
      const related = collaborations.filter((c) => c.proposal_id === proposal.id);
      return {
        proposal,
        review: reviews.get(proposal.id)!,
        team,
        mission: missions.get(proposal.mission_id) ?? null,
        university: team ? universities.get(team.created_by) ?? null : null,
        mine: related.find((c) => c.industry_user_id === userId) ?? null,
        interestCount: related.length,
      };
    });
}

/** Collaboration records created by the signed-in organisation. */
export async function getMyCollaborations(): Promise<CollaborationEntry[]> {
  const userId = await optionalUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("industry_collaborations")
    .select("*")
    .eq("industry_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const [proposals, reviews, teams, missions] = await Promise.all([
    fetchProposals(uniq(rows.map((c) => c.proposal_id))),
    fetchReviews(uniq(rows.map((c) => c.proposal_id))),
    fetchTeams(uniq(rows.map((c) => c.team_id))),
    fetchMissions(uniq(rows.map((c) => c.challenge_id))),
  ]);
  const universities = await fetchProfiles(
    uniq(Array.from(teams.values()).map((t) => t.created_by)),
  );

  return rows.map((collaboration) => {
    const team = teams.get(collaboration.team_id) ?? null;
    return {
      collaboration,
      proposal: proposals.get(collaboration.proposal_id) ?? null,
      review: reviews.get(collaboration.proposal_id) ?? null,
      team,
      mission: missions.get(collaboration.challenge_id) ?? null,
      university: team ? universities.get(team.created_by) ?? null : null,
    };
  });
}

export interface NewInterest {
  proposalId: string;
  challengeId: string;
  teamId: string;
  supportTypes: string[];
  message: string;
  nextStep: string | null;
}

/** Register this organisation's interest in a reviewed proposal. */
export async function expressInterest(input: NewInterest): Promise<CollaborationRow> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("industry_collaborations")
    .insert({
      proposal_id: input.proposalId,
      challenge_id: input.challengeId,
      team_id: input.teamId,
      industry_user_id: userId,
      support_types: input.supportTypes,
      message: input.message,
      next_step: input.nextStep,
      status: "INTEREST_EXPRESSED",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505" || error.code === "23514" || error.code === "23000") {
      throw new Error("Your organisation has already engaged with this solution.");
    }
    throw error;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(COLLABORATION_CREATED_EVENT));
  }
  return data;
}

/** Move a collaboration along its lifecycle. */
export async function setCollaborationStatus(
  id: string,
  status: CollaborationStatus,
): Promise<CollaborationRow> {
  const { data, error } = await supabase
    .from("industry_collaborations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Industry signals raised against one university team. */
export async function getIndustrySignals(teamId: string): Promise<IndustrySignal[]> {
  if (!(await optionalUserId())) return [];

  const { data, error } = await supabase
    .from("industry_collaborations")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const orgs = await fetchProfiles(uniq(rows.map((c) => c.industry_user_id)));
  return rows.map((collaboration) => ({
    collaboration,
    organization: orgs.get(collaboration.industry_user_id) ?? null,
  }));
}

/**
 * Realtime INSERT subscription on collaborations. Rows still pass through RLS,
 * so a university only receives signals raised against its own teams.
 */
export function subscribeToIndustrySignals(
  onInsert: (row: CollaborationRow) => void,
) {
  const channel = supabase
    .channel("civicx-industry-collaborations")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "industry_collaborations" },
      (payload) => onInsert(payload.new as CollaborationRow),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export interface OrganizationEdit {
  name: string;
  institution: string;
  organizationType: string | null;
  industryDomain: string | null;
  website: string | null;
  bio: string | null;
  expertiseAreas: string[];
  technologies: string[];
  supportCapabilities: string[];
}

/** Read the organisation profile of the signed-in industry account. */
export async function getOrganizationProfile(): Promise<ProfileRow | null> {
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

/** Save the organisation profile. `role` is never sent — the database pins it. */
export async function saveOrganizationProfile(
  edit: OrganizationEdit,
): Promise<ProfileRow> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: edit.name,
      institution: edit.institution,
      organization_type: edit.organizationType,
      industry_domain: edit.industryDomain,
      website: edit.website,
      bio: edit.bio,
      expertise_areas: edit.expertiseAreas,
      technologies: edit.technologies,
      support_capabilities: edit.supportCapabilities,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Comma or newline separated free text into a clean list. */
export function parseList(raw: string): string[] {
  return uniq(
    raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * How well an opportunity matches this organisation's stated capabilities.
 * Returns null when the profile has nothing to match on, so the UI can say so
 * instead of inventing a score.
 */
export function matchScore(
  opportunity: Opportunity,
  profile: ProfileRow | null,
): { percent: number; overlap: string[] } | null {
  const strengths = uniq([
    ...(profile?.expertise_areas ?? []),
    ...(profile?.technologies ?? []),
  ]).map((s) => s.toLowerCase());
  if (strengths.length === 0) return null;

  const needs = uniq([
    ...(opportunity.proposal.technologies ?? []),
    ...(opportunity.mission?.recommended_skills ?? []),
  ]);
  if (needs.length === 0) return null;

  const overlap = needs.filter((need) => {
    const n = need.toLowerCase();
    return strengths.some((s) => s.includes(n) || n.includes(s));
  });

  return { percent: Math.round((overlap.length / needs.length) * 100), overlap };
}
