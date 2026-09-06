/**
 * CivicX solution proposal data layer.
 *
 * Every call runs with the signed-in user's session, so the membership-based
 * Row Level Security policies decide what can be read and written. Content
 * immutability after submission and leader-only submission are enforced by the
 * database, not by this file.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type ProposalRow = Database["public"]["Tables"]["solution_proposals"]["Row"];
export type ProposalReviewRow = Database["public"]["Tables"]["proposal_reviews"]["Row"];

export type ProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_AI_REVIEW"
  | "AI_REVIEW_COMPLETE"
  | "AI_REVIEW_FAILED";

export const proposalStatusLabel: Record<string, string> = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_AI_REVIEW: "UNDER AI REVIEW",
  AI_REVIEW_COMPLETE: "AI REVIEW COMPLETE",
  AI_REVIEW_FAILED: "AI REVIEW UNAVAILABLE",
};

/** One phase of the implementation plan as stored in the JSON column. */
export interface ProposalPhase {
  name: string;
  description: string;
  duration: string;
}

export interface ProposalDraft {
  problemUnderstanding: string;
  proposedSolution: string;
  technologies: string[];
  expectedImpact: string;
  implementationPlan: ProposalPhase[];
  estimatedTimeline: string;
  resourcesRequired: string[];
}

export const DEFAULT_PHASES: ProposalPhase[] = [
  { name: "Research & Validation", description: "", duration: "" },
  { name: "Prototype Development", description: "", duration: "" },
  { name: "Field Testing", description: "", duration: "" },
  { name: "Deployment", description: "", duration: "" },
];

export const MIN_TEXT = 50;

/** Reads the stored JSON plan back into typed phases, ignoring bad entries. */
export function parsePhases(value: unknown): ProposalPhase[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    return [
      {
        name: typeof record["name"] === "string" ? record["name"] : "",
        description: typeof record["description"] === "string" ? record["description"] : "",
        duration: typeof record["duration"] === "string" ? record["duration"] : "",
      },
    ];
  });
}

export function draftFromRow(row: ProposalRow): ProposalDraft {
  return {
    problemUnderstanding: row.problem_understanding,
    proposedSolution: row.proposed_solution,
    technologies: row.technologies ?? [],
    expectedImpact: row.expected_impact,
    implementationPlan: parsePhases(row.implementation_plan),
    estimatedTimeline: row.estimated_timeline,
    resourcesRequired: row.resources_required ?? [],
  };
}

export function emptyDraft(): ProposalDraft {
  return {
    problemUnderstanding: "",
    proposedSolution: "",
    technologies: [],
    expectedImpact: "",
    implementationPlan: DEFAULT_PHASES.map((p) => ({ ...p })),
    estimatedTimeline: "",
    resourcesRequired: [],
  };
}

/** Validation messages shown before submission is allowed. */
export function validateDraft(draft: ProposalDraft): string[] {
  const errors: string[] = [];
  if (draft.problemUnderstanding.trim().length < MIN_TEXT)
    errors.push(`Problem understanding needs at least ${MIN_TEXT} characters.`);
  if (draft.proposedSolution.trim().length < MIN_TEXT)
    errors.push(`Proposed solution needs at least ${MIN_TEXT} characters.`);
  if (draft.expectedImpact.trim().length < MIN_TEXT)
    errors.push(`Expected impact needs at least ${MIN_TEXT} characters.`);
  if (draft.technologies.length === 0)
    errors.push("Add at least one technology or approach tag.");
  const phases = draft.implementationPlan.filter(
    (p) => p.name.trim() && p.description.trim(),
  );
  if (phases.length === 0)
    errors.push("Describe at least one implementation phase with a name and description.");
  if (!draft.estimatedTimeline.trim())
    errors.push("Add an estimated timeline, for example “8 weeks”.");
  if (draft.resourcesRequired.length === 0)
    errors.push("List at least one resource your team needs.");
  return errors;
}

/* ---------- reads ---------- */

export async function getProposalForTeam(teamId: string): Promise<ProposalRow | null> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Every proposal visible to this account, keyed by team id. */
export async function getMyProposals(): Promise<Map<string, ProposalRow>> {
  const { data, error } = await supabase.from("solution_proposals").select("*");
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.team_id, row]));
}

export async function getReview(proposalId: string): Promise<ProposalReviewRow | null> {
  const { data, error } = await supabase
    .from("proposal_reviews")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

/* ---------- writes ---------- */

function payload(draft: ProposalDraft) {
  return {
    problem_understanding: draft.problemUnderstanding,
    proposed_solution: draft.proposedSolution,
    technologies: draft.technologies,
    expected_impact: draft.expectedImpact,
    implementation_plan: draft.implementationPlan as unknown as Json,
    estimated_timeline: draft.estimatedTimeline,
    resources_required: draft.resourcesRequired,
  };
}

export async function createDraft(input: {
  missionId: string;
  teamId: string;
  userId: string;
  draft: ProposalDraft;
}): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .insert({
      mission_id: input.missionId,
      team_id: input.teamId,
      created_by: input.userId,
      status: "DRAFT",
      ...payload(input.draft),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveDraft(id: string, draft: ProposalDraft): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .update(payload(draft))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Marks the proposal submitted. The database blocks non-leaders. */
export async function submitProposal(id: string): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .update({ status: "SUBMITTED", submitted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
