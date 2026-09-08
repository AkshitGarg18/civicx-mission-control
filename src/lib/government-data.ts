/**
 * Static presentation config for the government console: navigation, the
 * canonical civic lifecycle and the oversight filters. No civic data lives
 * here — every number and record is read from the real database.
 */

import {
  BarChart3,
  Building2,
  Landmark,
  LayoutDashboard,
  Map as MapIcon,
  ShieldAlert,
  Radar,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface GovernmentNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const governmentNav: GovernmentNavItem[] = [
  { id: "command-center", label: "Command Center", icon: LayoutDashboard },
  { id: "missions", label: "Civic Missions", icon: Radar },
  { id: "map", label: "Live Map", icon: MapIcon },
  { id: "emergency", label: "Emergency Signals", icon: ShieldAlert },
  { id: "teams", label: "Teams & Solutions", icon: Users },
  { id: "industry", label: "Industry Collaboration", icon: Building2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "organization", label: "Organization Profile", icon: Landmark },
];

export const governmentRoleIcon = Landmark;

/* ---------------- civic lifecycle ---------------- */

/** How far a stage has progressed, derived only from stored records. */
export type StageState = "done" | "current" | "pending" | "untracked";

export interface LifecycleStage {
  id: string;
  label: string;
  state: StageState;
  /** What in the database proves this stage, or why it cannot be shown. */
  detail: string;
}

export const stageTone: Record<StageState, string> = {
  done: "text-signal border-signal/40 bg-signal/10",
  current: "text-violet border-violet/50 bg-violet/10",
  pending: "text-muted-foreground border-border bg-muted/10",
  untracked: "text-muted-foreground border-dashed border-border bg-transparent",
};

/* ---------------- oversight filters ---------------- */

export const priorityOptions = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export interface StatusGroup {
  id: string;
  label: string;
  match: readonly string[];
}

/** Stored challenge statuses grouped into the lifecycle phases. */
export const statusGroups: readonly StatusGroup[] = [
  { id: "ALL", label: "All statuses", match: [] as string[] },
  {
    id: "REPORTED",
    label: "Reported",
    match: ["REPORTED", "AI_ANALYSIS", "AI_ANALYSIS_FAILED"],
  },
  {
    id: "ANALYSED",
    label: "AI analysis complete",
    match: ["AI_ANALYSIS_COMPLETE", "AI ANALYSIS"],
  },
  { id: "TEAM", label: "Team forming / formed", match: ["TEAM_FORMING", "TEAM_FORMED", "MATCHING"] },
  {
    id: "PROPOSAL",
    label: "Proposal stage",
    match: ["PROPOSAL_DRAFT", "PROPOSAL_SUBMITTED", "AI_REVIEW", "AI_REVIEW_COMPLETE"],
  },
  { id: "INDUSTRY", label: "Industry engaged", match: ["INDUSTRY_INTEREST", "COLLABORATION"] },
  { id: "IMPACT", label: "Impact recorded", match: ["IMPACT", "RESOLVED"] },
];

export const dateOptions = [
  { id: "ALL", label: "Any date", days: 0 },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
] as const;

export const involvementOptions = [
  { id: "ALL", label: "Any" },
  { id: "YES", label: "Involved" },
  { id: "NO", label: "Not involved" },
] as const;

export type InvolvementId = (typeof involvementOptions)[number]["id"];

export interface GovernmentFilters {
  category: string;
  priority: string;
  status: string;
  location: string;
  date: string;
  university: InvolvementId;
  industry: InvolvementId;
}

export const emptyFilters: GovernmentFilters = {
  category: "ALL",
  priority: "ALL",
  status: "ALL",
  location: "",
  date: "ALL",
  university: "ALL",
  industry: "ALL",
};

/** Human labels for the stored collaboration pipeline. */
export const collaborationPipeline = [
  { id: "INTEREST_EXPRESSED", label: "INTEREST EXPRESSED" },
  { id: "UNDER_DISCUSSION", label: "UNDER DISCUSSION" },
  { id: "ACTIVE", label: "ACTIVE" },
  { id: "COMPLETED", label: "COMPLETED" },
] as const;

/** Live oversight event kinds surfaced as in-app notifications. */
export const liveEventLabels = {
  challenge: "⚡ NEW CIVIC CHALLENGE",
  team: "⚡ NEW UNIVERSITY TEAM",
  proposal: "⚡ NEW PROPOSAL",
  review: "⚡ AI REVIEW COMPLETED",
  interest: "⚡ NEW INDUSTRY SIGNAL",
  collaboration: "⚡ COLLABORATION UPDATED",
} as const;

export type LiveEventKind = keyof typeof liveEventLabels;
