/**
 * CivicX solution-proposal data layer (university side).
 *
 * Reads and writes the existing `solution_proposals` and `proposal_reviews`
 * tables with the signed-in user's session, so the Row Level Security policies
 * and the database triggers decide what is allowed: team members may edit a
 * draft, only the team leader may submit, and a submitted proposal can no
 * longer be edited.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProposalRow = Database["public"]["Tables"]["solution_proposals"]["Row"];
export type ProposalReviewRow = Database["public"]["Tables"]["proposal_reviews"]["Row"];

/** One delivery phase stored inside `implementation_plan`. */
export interface ProposalPhase {
  name: string;
  description: string;
  outcome: string;
}

export interface ProposalDraft {
  problemUnderstanding: string;
  proposedSolution: string;
  /** Free text; stored as the `technologies` list, one entry per line. */
  technologies: string;
  expectedImpact: string;
  phases: ProposalPhase[];
  estimatedTimeline: string;
  /** Free text; stored as the `resources_required` list, one entry per line. */
  resourcesRequired: string;
}

export const emptyPhase = (): ProposalPhase => ({
  name: "",
  description: "",
  outcome: "",
});

export const emptyDraft = (): ProposalDraft => ({
  problemUnderstanding: "",
  proposedSolution: "",
  technologies: "",
  expectedImpact: "",
  phases: [emptyPhase()],
  estimatedTimeline: "",
  resourcesRequired: "",
});

const listToText = (values: string[] | null): string => (values ?? []).join("\n");

const textToList = (value: string): string[] =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

/** Tolerant parse of the stored jsonb plan, including older `duration` keys. */
export function parsePhases(raw: unknown): ProposalPhase[] {
  if (!Array.isArray(raw)) return [];
  const phases: ProposalPhase[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    phases.push({
      name: typeof row["name"] === "string" ? row["name"] : "",
      description: typeof row["description"] === "string" ? row["description"] : "",
      outcome:
        typeof row["outcome"] === "string"
          ? row["outcome"]
          : typeof row["duration"] === "string"
            ? row["duration"]
            : "",
    });
  }
  return phases;
}

export function toDraft(row: ProposalRow): ProposalDraft {
  const phases = parsePhases(row.implementation_plan);
  return {
    problemUnderstanding: row.problem_understanding ?? "",
    proposedSolution: row.proposed_solution ?? "",
    technologies: listToText(row.technologies),
    expectedImpact: row.expected_impact ?? "",
    phases: phases.length > 0 ? phases : [emptyPhase()],
    estimatedTimeline: row.estimated_timeline ?? "",
    resourcesRequired: listToText(row.resources_required),
  };
}

/** Sections that must be filled in before the proposal may be submitted. */
export function missingSections(draft: ProposalDraft): string[] {
  const missing: string[] = [];
  if (draft.problemUnderstanding.trim().length < 40) missing.push("Problem Understanding");
  if (draft.proposedSolution.trim().length < 40) missing.push("Proposed Solution");
  if (textToList(draft.technologies).length === 0) missing.push("Technology & Approach");
  if (draft.expectedImpact.trim().length < 30) missing.push("Expected Impact");
  const phases = draft.phases.filter(
    (p) => p.name.trim().length > 0 && p.description.trim().length > 0,
  );
  if (phases.length === 0) missing.push("Phased Implementation Plan");
  if (draft.estimatedTimeline.trim().length === 0) missing.push("Timeline");
  if (textToList(draft.resourcesRequired).length === 0) missing.push("Resources Required");
  return missing;
}

/** Rough per-section completion used by the progress navigator. */
export function sectionComplete(draft: ProposalDraft, sectionId: string): boolean {
  switch (sectionId) {
    case "problem":
      return draft.problemUnderstanding.trim().length >= 40;
    case "solution":
      return draft.proposedSolution.trim().length >= 40;
    case "technology":
      return textToList(draft.technologies).length > 0;
    case "impact":
      return draft.expectedImpact.trim().length >= 30;
    case "implementation":
      return draft.phases.some(
        (p) => p.name.trim().length > 0 && p.description.trim().length > 0,
      );
    case "timeline":
      return draft.estimatedTimeline.trim().length > 0;
    case "resources":
      return textToList(draft.resourcesRequired).length > 0;
    default:
      return false;
  }
}

/* ---------- reads ---------- */

export interface ProposalBundle {
  proposal: ProposalRow | null;
  review: ProposalReviewRow | null;
}

/** The stored proposal for one team + mission pair, with its AI review. */
export async function getProposalForTeam(
  teamId: string,
  missionId: string,
): Promise<ProposalBundle> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .select("*")
    .eq("team_id", teamId)
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;

  const proposal = data?.[0] ?? null;
  if (!proposal) return { proposal: null, review: null };
  return { proposal, review: await getProposalReview(proposal.id) };
}

/** Every proposal the signed-in university account can read. */
export async function getMyProposals(): Promise<ProposalRow[]> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProposalReview(
  proposalId: string,
): Promise<ProposalReviewRow | null> {
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

function draftColumns(draft: ProposalDraft) {
  return {
    problem_understanding: draft.problemUnderstanding.trim(),
    proposed_solution: draft.proposedSolution.trim(),
    technologies: textToList(draft.technologies),
    expected_impact: draft.expectedImpact.trim(),
    implementation_plan: draft.phases
      .filter((p) => p.name.trim().length > 0 || p.description.trim().length > 0)
      .map((p) => ({
        name: p.name.trim(),
        description: p.description.trim(),
        outcome: p.outcome.trim(),
      })),
    estimated_timeline: draft.estimatedTimeline.trim(),
    resources_required: textToList(draft.resourcesRequired),
  };
}

/**
 * Creates the draft row on first save and updates it afterwards. The mission
 * status history is written by the existing database trigger.
 */
export async function saveProposalDraft(input: {
  proposalId: string | null;
  teamId: string;
  missionId: string;
  draft: ProposalDraft;
}): Promise<ProposalRow> {
  const columns = draftColumns(input.draft);

  if (input.proposalId) {
    const { data, error } = await supabase
      .from("solution_proposals")
      .update(columns)
      .eq("id", input.proposalId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  if (!userId) throw new Error("You need to be signed in to save this proposal.");

  const { data, error } = await supabase
    .from("solution_proposals")
    .insert({
      mission_id: input.missionId,
      team_id: input.teamId,
      created_by: userId,
      status: "DRAFT",
      ...columns,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Marks the proposal submitted. The database trigger rejects this unless the
 * caller is the team leader, and locks the content from then on.
 */
export async function submitProposal(proposalId: string): Promise<ProposalRow> {
  const { data, error } = await supabase
    .from("solution_proposals")
    .update({ status: "SUBMITTED", submitted_at: new Date().toISOString() })
    .eq("id", proposalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** A proposal that finished AI review is what makes it visible to industry. */
export function isIndustryReady(
  proposal: ProposalRow | null,
  review: ProposalReviewRow | null,
): boolean {
  return !!proposal && proposal.status === "AI_REVIEW_COMPLETE" && !!review;
}
