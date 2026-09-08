import {
  Compass,
  FilePlus2,
  LayoutDashboard,
  Radar,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChallengeNode, MissionStatus, Priority } from "./civicx-data";

/**
 * Mock data for the citizen console. Every export here is shaped the way the
 * real backend will return it, so the UI can be re-pointed at Supabase / Gemini
 * later without touching components.
 */

export interface CitizenProfile {
  name: string;
  role: string;
  initials: string;
  city: string;
}

export const citizenProfile: CitizenProfile = {
  name: "Demo Citizen",
  role: "Community Member",
  initials: "DC",
  city: "Rohini, Delhi",
};

export interface CitizenNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const citizenNav: CitizenNavItem[] = [
  { id: "command-center", label: "Command Center", icon: LayoutDashboard },
  { id: "report", label: "Report Challenge", icon: FilePlus2 },
  { id: "missions", label: "My Missions", icon: Radar },
  { id: "nearby", label: "Explore Challenges", icon: Compass },
  { id: "impact", label: "Impact", icon: Sparkles },
];

export interface CivicStat {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  accent: string;
  caption: string;
}

export const civicStats: CivicStat[] = [
  {
    label: "ACTIVE LOCAL CHALLENGES",
    value: 24,
    accent: "var(--neon-cyan)",
    caption: "within 8 km of you",
  },
  {
    label: "MY REPORTS",
    value: 7,
    accent: "var(--neon-azure)",
    caption: "signals transmitted",
  },
  {
    label: "MISSIONS RESOLVED",
    value: 3,
    accent: "var(--signal)",
    caption: "verified outcomes",
  },
  {
    label: "COMMUNITY IMPACT",
    value: 12.4,
    decimals: 1,
    suffix: "K+",
    accent: "var(--neon-violet)",
    caption: "people reached",
  },
];

/** Categories offered in the report flow (superset of the map categories). */
export const reportCategories = [
  "Water",
  "Waste",
  "Education",
  "Healthcare",
  "Infrastructure",
  "Public Safety",
  "Environment",
  "Other",
] as const;

export type ReportCategory = (typeof reportCategories)[number];

export const reportCategoryAccent: Record<ReportCategory, string> = {
  Water: "var(--neon-cyan)",
  Waste: "var(--warn)",
  Education: "var(--neon-violet)",
  Healthcare: "var(--signal)",
  Infrastructure: "var(--neon-azure)",
  "Public Safety": "var(--destructive)",
  Environment: "var(--signal)",
  Other: "var(--neon-azure)",
};

export interface CitizenMission {
  id: string;
  code: string;
  title: string;
  location: string;
  priority: Priority;
  status: MissionStatus;
  progress: number;
  reported: string;
}

export const myMissions: CitizenMission[] = [
  {
    id: "cm1",
    code: "MISSION #0421",
    title: "Waste Overflow Near Rohini Sector 7",
    location: "Rohini, Delhi",
    priority: "HIGH",
    status: "AI ANALYSIS COMPLETE",
    progress: 20,
    reported: "2 days ago",
  },
  {
    id: "cm2",
    code: "MISSION #0397",
    title: "Flooded Underpass",
    location: "Pitampura, Delhi",
    priority: "MEDIUM",
    status: "MATCHING IN PROGRESS",
    progress: 45,
    reported: "3 weeks ago",
  },
  {
    id: "cm3",
    code: "MISSION #0312",
    title: "Broken Street Lighting",
    location: "Sector 11, Rohini",
    priority: "MEDIUM",
    status: "MISSION COMPLETED",
    progress: 100,
    reported: "4 months ago",
  },
];

/** Nearby civic signals rendered on the community network map. */
export const nearbyChallenges: ChallengeNode[] = [
  {
    id: "n1",
    code: "MISSION #0421",
    name: "Waste Overflow",
    location: "Rohini, Delhi",
    category: "Waste",
    priority: "HIGH",
    affected: "12,400 affected",
    status: "AI ANALYSIS COMPLETE",
    confidence: 94,
    description:
      "Recurring waste overflow beside Sector 7 market spills onto the footpath and a nearby school route.",
    aiAnalysis:
      "Classified as solid waste management. Collection frequency and segregation gaps identified as root causes.",
    skills: ["Waste Management", "IoT", "Data Analytics", "Urban Planning"],
    x: 34,
    y: 30,
  },
  {
    id: "n2",
    code: "MISSION #0397",
    name: "Flooded Underpass",
    location: "Pitampura, Delhi",
    category: "Infrastructure",
    priority: "MEDIUM",
    affected: "8,100 affected",
    status: "MATCHING IN PROGRESS",
    confidence: 89,
    description:
      "The underpass holds knee-deep water for hours after moderate rain, cutting off a main commuter link.",
    aiAnalysis:
      "Categorised as urban drainage failure. Pump capacity and silted inlets flagged as primary factors.",
    skills: ["Civil Engineering", "Drainage Design", "GIS Mapping"],
    x: 62,
    y: 20,
  },
  {
    id: "n3",
    code: "MISSION #0455",
    name: "Water Supply Gap",
    location: "Budh Vihar, Delhi",
    category: "Water",
    priority: "CRITICAL",
    affected: "21,600 affected",
    status: "TEAM FOUND",
    confidence: 92,
    description:
      "Households in three blocks receive piped water for under an hour a day and depend on paid tankers.",
    aiAnalysis:
      "Water scarcity with distribution loss dominant. Pressure-zone mapping recommended.",
    skills: ["Hydrology", "GIS Mapping", "Data Analysis"],
    x: 20,
    y: 62,
  },
  {
    id: "n4",
    code: "MISSION #0468",
    name: "Unsafe Crossing",
    location: "Sector 24, Rohini",
    category: "Safety",
    priority: "HIGH",
    affected: "5,300 affected",
    status: "SIGNAL DETECTED",
    confidence: 86,
    description:
      "No signalled crossing outside a school gate on a four-lane road; near-misses reported daily.",
    aiAnalysis:
      "Classified as road safety. Traffic calming and signal placement recommended for review.",
    skills: ["Traffic Engineering", "Urban Design", "Public Policy"],
    x: 52,
    y: 55,
  },
  {
    id: "n5",
    code: "MISSION #0479",
    name: "Clinic Overload",
    location: "Sultanpuri, Delhi",
    category: "Healthcare",
    priority: "HIGH",
    affected: "17,900 affected",
    status: "INDUSTRY SUPPORT AVAILABLE",
    confidence: 90,
    description:
      "A single primary health centre serves five colonies, with waiting times crossing four hours.",
    aiAnalysis:
      "Healthcare access shortfall. Queue modelling and tele-triage identified as viable interventions.",
    skills: ["Public Health", "Operations Research", "Health Informatics"],
    x: 76,
    y: 48,
  },
  {
    id: "n6",
    code: "MISSION #0312",
    name: "Street Lighting",
    location: "Sector 11, Rohini",
    category: "Infrastructure",
    priority: "MEDIUM",
    affected: "3,200 affected",
    status: "MISSION COMPLETED",
    confidence: 88,
    description:
      "A 900 m stretch of unlit road was mapped, repaired and converted to solar-assisted lighting.",
    aiAnalysis:
      "Resolved through a university retrofit study with municipal execution support.",
    skills: ["Electrical Engineering", "Solar Design"],
    x: 42,
    y: 78,
  },
  {
    id: "n7",
    code: "MISSION #0490",
    name: "School Dropouts",
    location: "Mangolpuri, Delhi",
    category: "Education",
    priority: "HIGH",
    affected: "2,700 affected",
    status: "MISSION ACTIVE",
    confidence: 84,
    description:
      "Attendance in two government schools drops sharply after grade 8, especially among girls.",
    aiAnalysis:
      "Education continuity risk. Household survey and mentoring programme suggested.",
    skills: ["Education Research", "Data Analytics", "Community Outreach"],
    x: 68,
    y: 74,
  },
];

/** Mock location suggestions for the report flow. */
export interface MockLocation {
  label: string;
  area: string;
  lat: string;
  lng: string;
}

export const mockLocations: MockLocation[] = [
  { label: "ROHINI, DELHI", area: "Sector 7, Rohini", lat: "28.7495° N", lng: "77.0676° E" },
  { label: "PITAMPURA, DELHI", area: "Netaji Subhash Place", lat: "28.6942° N", lng: "77.1315° E" },
  { label: "BUDH VIHAR, DELHI", area: "Block C, Budh Vihar", lat: "28.7078° N", lng: "77.0432° E" },
  { label: "SULTANPURI, DELHI", area: "A Block, Sultanpuri", lat: "28.6960° N", lng: "77.0700° E" },
];

export const currentLocation: MockLocation = mockLocations[0]!;

/** Steps the AI analysis screen animates through. */
export const analysisSteps = [
  "Processing description",
  "Identifying category",
  "Estimating priority",
  "Detecting potential impact",
  "Identifying relevant expertise",
  "Generating solution directions",
] as const;

export interface AiAnalysisResult {
  category: string;
  priority: Priority;
  confidence: number;
  impact: string;
  skills: string[];
  summary: string;
  stakeholders?: string[];
  directions?: string[];
  missionCode: string;
  /** Advisory emergency assessment, when the analysis produced one. */
  threat?: import("@/lib/emergency-service").ThreatAssessment;
}


/**
 * Demo AI output. Replace this with a Gemini response later — the shape is the
 * contract the analysis screen renders.
 */
export const demoAnalysis: AiAnalysisResult = {
  category: "Waste Management",
  priority: "HIGH",
  confidence: 94,
  impact: "12,400 citizens",
  skills: ["Waste Management", "IoT", "Data Analytics", "Urban Planning"],
  summary:
    "Recurring waste overflow has been reported near Rohini Sector 7. The issue appears to affect nearby residential and educational areas.",
  missionCode: "MISSION #0512",
};

export interface ImpactMetric {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  accent: string;
}

export const impactMetrics: ImpactMetric[] = [
  { label: "CHALLENGES REPORTED", value: 7, accent: "var(--neon-cyan)" },
  { label: "MISSIONS COMPLETED", value: 3, accent: "var(--signal)" },
  { label: "PEOPLE IMPACTED", value: 12.4, decimals: 1, suffix: "K+", accent: "var(--neon-violet)" },
];
