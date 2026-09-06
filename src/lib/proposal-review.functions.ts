/**
 * Server-side AI feasibility review of a submitted solution proposal.
 *
 * Runs entirely on the server: the model credential never reaches the browser.
 * Database access uses the caller's own session, so the membership-based Row
 * Level Security policies decide what the caller may read and write. The
 * proposal/team relationship is verified again here before any model call.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const LEVELS = ["HIGH", "MEDIUM", "LOW", "INSUFFICIENT INFORMATION"] as const;
const NEXT_STEPS = [
  "READY FOR INDUSTRY REVIEW",
  "NEEDS IMPROVEMENT",
  "REQUIRES MAJOR REVISION",
  "INSUFFICIENT INFORMATION",
] as const;

type Level = (typeof LEVELS)[number];
type NextStep = (typeof NEXT_STEPS)[number];

export interface ProposalFeasibilityReview {
  technicalFeasibility: Level;
  impactPotential: Level;
  implementationComplexity: Level;
  skillAlignment: Level;
  assessment: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  nextStep: NextStep;
}

export class ReviewUnavailableError extends Error {
  constructor() {
    super(
      "Your proposal was submitted, but the AI feasibility review could not be completed. You can retry.",
    );
    this.name = "ReviewUnavailableError";
  }
}

const SYSTEM_PROMPT = `You are CivicX's civic-innovation feasibility reviewer. A university student team has submitted a solution proposal for a citizen-reported civic challenge. Assess the proposal strategically and honestly.

Reply with ONLY a JSON object in this exact shape:
{
  "technical_feasibility": "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT INFORMATION",
  "impact_potential": "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT INFORMATION",
  "implementation_complexity": "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT INFORMATION",
  "skill_alignment": "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT INFORMATION",
  "assessment": "string",
  "strengths": ["string", ...],
  "risks": ["string", ...],
  "recommendations": ["string", ...],
  "next_step": "READY FOR INDUSTRY REVIEW" | "NEEDS IMPROVEMENT" | "REQUIRES MAJOR REVISION" | "INSUFFICIENT INFORMATION"
}
Rules:
- Never produce numeric scores, percentages, ratings or success probabilities of any kind. Use only the qualitative levels above.
- Never invent real-world facts, statistics, costs, regulations, datasets or external references that are not present in the mission or proposal text.
- When the proposal does not contain enough information to judge a dimension, use "INSUFFICIENT INFORMATION" for it and say so plainly in the assessment instead of guessing.
- Base the review strictly on the mission analysis, the proposal text and the team's stated skill coverage.
- Word the assessment so it is clear this is an AI assessment, not a verified evaluation.
- Give 2-5 strengths, 2-5 risks and 2-5 recommendations, each one concrete and actionable.`;

function stringList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

function level(value: unknown, field: string): Level {
  const raw = String(value ?? "").toUpperCase().trim();
  if (!LEVELS.includes(raw as Level)) throw new Error(`invalid ${field}: ${raw}`);
  return raw as Level;
}

function parseReview(raw: string): ProposalFeasibilityReview {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? raw).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("model returned no JSON object");

  const parsed = JSON.parse(body.slice(start, end + 1)) as Record<string, unknown>;

  const assessment =
    typeof parsed["assessment"] === "string" ? parsed["assessment"].trim() : "";
  if (assessment.length < 20) throw new Error("assessment too short");

  const nextStep = String(parsed["next_step"] ?? "").toUpperCase().trim() as NextStep;
  if (!NEXT_STEPS.includes(nextStep)) throw new Error(`invalid next_step: ${nextStep}`);

  const strengths = stringList(parsed["strengths"], 5);
  const risks = stringList(parsed["risks"], 5);
  const recommendations = stringList(parsed["recommendations"], 5);
  if (strengths.length === 0 || risks.length === 0 || recommendations.length === 0)
    throw new Error("review lists incomplete");

  return {
    technicalFeasibility: level(parsed["technical_feasibility"], "technical_feasibility"),
    impactPotential: level(parsed["impact_potential"], "impact_potential"),
    implementationComplexity: level(
      parsed["implementation_complexity"],
      "implementation_complexity",
    ),
    skillAlignment: level(parsed["skill_alignment"], "skill_alignment"),
    assessment,
    strengths,
    risks,
    recommendations,
    nextStep,
  };
}

async function callModel(prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    console.error("[civicx] LOVABLE_API_KEY is not configured");
    throw new ReviewUnavailableError();
  }

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[civicx] proposal review request failed [${response.status}]: ${detail}`);
    throw new ReviewUnavailableError();
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[civicx] proposal review response had no content");
    throw new ReviewUnavailableError();
  }
  return content;
}

/** Review a submitted proposal belonging to a team the caller is part of. */
export const reviewProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { proposalId: string }) => {
    const id = String(input?.proposalId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("A valid proposal id is required.");
    return { proposalId: id };
  })
  .handler(async ({ data, context }): Promise<ProposalFeasibilityReview> => {
    const { supabase, userId } = context;

    // RLS already restricts this read to the caller's own teams.
    const { data: proposal, error } = await supabase
      .from("solution_proposals")
      .select("*")
      .eq("id", data.proposalId)
      .maybeSingle();

    if (error) {
      console.error("[civicx] proposal lookup failed", error);
      throw new ReviewUnavailableError();
    }
    if (!proposal) throw new Error("This proposal could not be found.");

    const { data: membership } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", proposal.team_id)
      .eq("user_id", userId)
      .maybeSingle();
    const { data: team } = await supabase
      .from("teams")
      .select("id, team_name, created_by, skill_coverage")
      .eq("id", proposal.team_id)
      .maybeSingle();

    if (!team || (!membership && team.created_by !== userId))
      throw new Error("You can only review proposals from your own team.");

    if (proposal.status === "DRAFT")
      throw new Error("Submit the proposal before requesting an AI review.");

    const { data: mission } = await supabase
      .from("challenges")
      .select(
        "title, category, location_name, priority, ai_summary, estimated_impact, recommended_skills, affected_stakeholders, solution_directions",
      )
      .eq("id", proposal.mission_id)
      .maybeSingle();

    await supabase
      .from("solution_proposals")
      .update({ status: "UNDER_AI_REVIEW" })
      .eq("id", proposal.id);

    const plan = Array.isArray(proposal.implementation_plan)
      ? (proposal.implementation_plan as Array<Record<string, unknown>>)
          .map(
            (p, i) =>
              `  Phase ${i + 1}: ${String(p["name"] ?? "")} — ${String(
                p["description"] ?? "",
              )} (${String(p["duration"] ?? "duration not stated")})`,
          )
          .join("\n")
      : "  not provided";

    const prompt = [
      "ORIGINAL CIVIC MISSION",
      `Title: ${mission?.title ?? "not available"}`,
      `Category: ${mission?.category ?? "not provided"}`,
      `Location: ${mission?.location_name ?? "not provided"}`,
      `Priority: ${mission?.priority ?? "not provided"}`,
      `AI analysis of the challenge: ${mission?.ai_summary ?? "not available"}`,
      `AI estimated people affected: ${mission?.estimated_impact ?? "not estimated"}`,
      `AI recommended skills: ${(mission?.recommended_skills ?? []).join(", ") || "none"}`,
      `Affected stakeholders: ${(mission?.affected_stakeholders ?? []).join(", ") || "none"}`,
      `AI solution directions: ${(mission?.solution_directions ?? []).join(", ") || "none"}`,
      "",
      "UNIVERSITY TEAM",
      `Team name: ${team.team_name}`,
      `Team skill coverage of the recommended skills: ${
        team.skill_coverage === null ? "not calculated" : `${team.skill_coverage}%`
      }`,
      "",
      "SUBMITTED PROPOSAL",
      `Problem understanding: ${proposal.problem_understanding}`,
      `Proposed solution: ${proposal.proposed_solution}`,
      `Technology and approach: ${(proposal.technologies ?? []).join(", ") || "none"}`,
      `Expected impact: ${proposal.expected_impact}`,
      "Implementation plan:",
      plan,
      `Estimated timeline: ${proposal.estimated_timeline || "not provided"}`,
      `Resources required: ${(proposal.resources_required ?? []).join(", ") || "none"}`,
    ].join("\n");

    let review: ProposalFeasibilityReview;
    try {
      review = parseReview(await callModel(prompt));
    } catch (err) {
      console.error("[civicx] proposal review failed", err);
      await supabase
        .from("solution_proposals")
        .update({ status: "AI_REVIEW_FAILED" })
        .eq("id", proposal.id);
      throw new ReviewUnavailableError();
    }

    const { error: insertError } = await supabase.from("proposal_reviews").insert({
      proposal_id: proposal.id,
      technical_feasibility: review.technicalFeasibility,
      impact_potential: review.impactPotential,
      implementation_complexity: review.implementationComplexity,
      skill_alignment: review.skillAlignment,
      assessment: review.assessment,
      strengths: review.strengths,
      risks: review.risks,
      recommendations: review.recommendations,
      next_step: review.nextStep,
    });

    if (insertError) {
      console.error("[civicx] storing proposal review failed", insertError);
      await supabase
        .from("solution_proposals")
        .update({ status: "AI_REVIEW_FAILED" })
        .eq("id", proposal.id);
      throw new ReviewUnavailableError();
    }

    await supabase
      .from("solution_proposals")
      .update({ status: "AI_REVIEW_COMPLETE" })
      .eq("id", proposal.id);

    return review;
  });
