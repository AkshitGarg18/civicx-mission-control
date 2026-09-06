/**
 * Static presentation data for the university solution-proposal workspace.
 * No proposal content lives here — every field is read from and written to the
 * existing `solution_proposals` / `proposal_reviews` tables.
 */

export interface ProposalSection {
  index: string;
  id: string;
  navLabel: string;
  title: string;
  caption: string;
  placeholder?: string;
}

export const proposalSections: ProposalSection[] = [
  {
    index: "01",
    id: "problem",
    navLabel: "PROBLEM",
    title: "Problem Understanding",
    caption: "Show that the team truly understands the civic challenge.",
    placeholder:
      "Explain your understanding of the civic problem, its causes, affected users and why it needs to be solved.",
  },
  {
    index: "02",
    id: "solution",
    navLabel: "SOLUTION",
    title: "Proposed Solution",
    caption: "The blueprint your team will build.",
    placeholder:
      "Describe your proposed solution and how it addresses the identified problem.",
  },
  {
    index: "03",
    id: "technology",
    navLabel: "TECHNOLOGY",
    title: "Technology & Approach",
    caption: "How the solution is engineered.",
    placeholder:
      "Describe technologies, architecture, methodology, AI/ML components, hardware or other technical approaches.",
  },
  {
    index: "04",
    id: "impact",
    navLabel: "IMPACT",
    title: "Expected Impact",
    caption: "What changes for the city once this ships.",
    placeholder:
      "Describe the expected social, environmental, economic or operational impact.",
  },
  {
    index: "05",
    id: "implementation",
    navLabel: "IMPLEMENTATION",
    title: "Phased Implementation Plan",
    caption: "Break delivery into phases with clear outcomes.",
  },
  {
    index: "06",
    id: "timeline",
    navLabel: "TIMELINE",
    title: "Timeline",
    caption: "Expected implementation window.",
    placeholder: "e.g. 12 weeks starting January 2026",
  },
  {
    index: "07",
    id: "resources",
    navLabel: "RESOURCES",
    title: "Resources Required",
    caption: "Everything the team needs to execute.",
    placeholder:
      "Technical resources, infrastructure, human resources, funding or other resources required.",
  },
  {
    index: "08",
    id: "review",
    navLabel: "REVIEW",
    title: "AI Feasibility Review",
    caption: "Submit the blueprint for CivicX AI evaluation.",
  },
];

/** Stored proposal lifecycle states and how they are presented. */
export type ProposalStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_AI_REVIEW"
  | "AI_REVIEW_COMPLETE";

export const proposalStatusMeta: Record<
  ProposalStatus,
  { label: string; tone: string; caption: string }
> = {
  DRAFT: {
    label: "PROPOSAL DRAFT",
    tone: "text-muted-foreground border-border bg-muted/20",
    caption: "Editable by every team member. Nothing has been submitted yet.",
  },
  SUBMITTED: {
    label: "PROPOSAL SUBMITTED",
    tone: "text-azure border-azure/40 bg-azure/10",
    caption: "Locked for editing and queued for AI feasibility evaluation.",
  },
  UNDER_AI_REVIEW: {
    label: "AI REVIEW",
    tone: "text-warn border-warn/40 bg-warn/10",
    caption: "CivicX AI is evaluating the feasibility of this solution.",
  },
  AI_REVIEW_COMPLETE: {
    label: "AI REVIEW COMPLETE",
    tone: "text-signal border-signal/40 bg-signal/10",
    caption: "The AI feasibility evaluation is stored and read-only.",
  },
};

/** Cinematic lines shown while the existing AI review runs. */
export const reviewProgressSteps = [
  "PARSING SOLUTION BLUEPRINT",
  "CROSS-CHECKING AGAINST CIVIC CHALLENGE",
  "EVALUATING TECHNICAL FEASIBILITY",
  "MODELLING IMPACT POTENTIAL",
  "SCORING SKILL ALIGNMENT",
  "COMPILING FEASIBILITY REPORT",
];

export const ratingTone: Record<string, string> = {
  HIGH: "text-signal",
  MEDIUM: "text-warn",
  LOW: "text-destructive",
};

/** Complexity reads inversely — low complexity is the good outcome. */
export const complexityTone: Record<string, string> = {
  HIGH: "text-destructive",
  MEDIUM: "text-warn",
  LOW: "text-signal",
};
