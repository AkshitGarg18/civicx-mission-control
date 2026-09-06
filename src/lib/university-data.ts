import {
  BarChart3,
  FileStack,
  LayoutGrid,
  Radar,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Static configuration for the university console. No challenge data lives
 * here — the mission board reads real rows from the `challenges` table.
 */

export interface UniversityNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
}

export const universityNav: UniversityNavItem[] = [
  { id: "mission-board", label: "Mission Board", icon: LayoutGrid, ready: true },
  { id: "recommended", label: "Recommended", icon: Sparkles, ready: false },
  { id: "my-missions", label: "My Missions", icon: Radar, ready: true },
  { id: "teams", label: "Teams", icon: Users, ready: true },
  { id: "proposals", label: "Proposals", icon: FileStack, ready: true },
  { id: "impact", label: "Impact", icon: BarChart3, ready: false },
];

export const priorityFilters = ["ALL", "HIGH", "MEDIUM", "LOW"] as const;

export const categoryFilters = [
  "ALL",
  "Infrastructure",
  "Environment",
  "Waste",
  "Transport",
  "Safety",
  "Healthcare",
  "Education",
  "Other",
] as const;

/** Stored status values grouped into the labels universities care about. */
export const statusFilters = [
  { id: "ALL", label: "All", match: [] as string[] },
  { id: "REPORTED", label: "Reported", match: ["REPORTED", "AI_ANALYSIS", "AI_ANALYSIS_FAILED"] },
  {
    id: "ANALYSED",
    label: "AI Analysis Complete",
    match: ["AI_ANALYSIS_COMPLETE", "AI ANALYSIS"],
  },
  { id: "PROGRESS", label: "In Progress", match: ["MATCHING", "COLLABORATION"] },
  { id: "RESOLVED", label: "Resolved", match: ["IMPACT", "RESOLVED"] },
] as const;

export const sortOptions = [
  { id: "NEWEST", label: "Newest" },
  { id: "IMPACT", label: "Highest Impact" },
  { id: "PRIORITY", label: "Highest Priority" },
] as const;

export type SortId = (typeof sortOptions)[number]["id"];

export const priorityRank: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Team roles inferred from the AI-recommended skills. This is a deterministic
 * mapping of the stored skills, not a generated prediction.
 */
const roleBySkillKeyword: Array<{ keys: string[]; role: string }> = [
  { keys: ["iot", "embedded", "sensor", "hardware", "electronic"], role: "Hardware & IoT Lead" },
  { keys: ["vision", "ml", "machine learning", "ai", "data science"], role: "AI / Data Lead" },
  { keys: ["data", "analytics", "gis", "mapping"], role: "Data & Mapping Analyst" },
  { keys: ["app", "mobile", "web", "frontend", "full stack", "software"], role: "Software Engineer" },
  { keys: ["civil", "urban", "structural", "planning"], role: "Civil / Urban Planning Specialist" },
  { keys: ["environment", "waste", "water", "sanitation", "energy"], role: "Environmental Engineer" },
  { keys: ["public health", "health", "medical"], role: "Public Health Researcher" },
  { keys: ["design", "ux", "ui"], role: "Design & UX Researcher" },
  { keys: ["policy", "governance", "social", "community"], role: "Policy & Community Liaison" },
  { keys: ["project", "management", "operations"], role: "Project Coordinator" },
];

export function inferTeamRoles(skills: string[] | null): string[] {
  const roles = new Set<string>();
  for (const skill of skills ?? []) {
    const value = skill.toLowerCase();
    for (const entry of roleBySkillKeyword) {
      if (entry.keys.some((k) => value.includes(k))) roles.add(entry.role);
    }
  }
  if (roles.size > 0) roles.add("Project Coordinator");
  return [...roles];
}

/** Category label shown on cards, falling back to the stored free text. */
export function categoryLabel(raw: string | null): string {
  if (!raw || !raw.trim()) return "Uncategorised";
  return raw.trim();
}
