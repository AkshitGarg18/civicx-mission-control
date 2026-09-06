/**
 * Static presentation data for the industry console: navigation, the support
 * types an organisation can offer, and how collaboration states are rendered.
 */

import {
  Building2,
  Compass,
  Handshake,
  LayoutDashboard,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface IndustryNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const industryNav: IndustryNavItem[] = [
  { id: "command-center", label: "Command Center", icon: LayoutDashboard },
  { id: "opportunities", label: "Opportunities", icon: Compass },
  { id: "collaborations", label: "My Collaborations", icon: Handshake },
  { id: "organization", label: "Organization Profile", icon: Building2 },
  { id: "impact", label: "Impact", icon: TrendingUp },
];

/** The concrete kinds of support an industry partner can commit to. */
export const supportTypes = [
  "Mentorship",
  "Technology",
  "Funding",
  "Infrastructure",
  "Pilot deployment",
  "Data access",
  "Manufacturing",
  "Market access",
] as const;

export type SupportType = (typeof supportTypes)[number];

export const nextStepOptions = [
  "Introductory call",
  "Technical deep dive",
  "Site visit",
  "Written proposal review",
  "Pilot scoping workshop",
] as const;

export const organizationTypes = [
  "Startup",
  "Enterprise",
  "MSME",
  "Consultancy",
  "Non-profit",
  "Investor / Fund",
] as const;

export type CollaborationStatus =
  | "INTEREST_EXPRESSED"
  | "UNDER_DISCUSSION"
  | "ACTIVE"
  | "COMPLETED"
  | "DECLINED";

interface StatusMeta {
  label: string;
  tone: string;
  caption: string;
}

export const collaborationStatusMeta: Record<CollaborationStatus, StatusMeta> = {
  INTEREST_EXPRESSED: {
    label: "INTEREST EXPRESSED",
    tone: "text-warn border-warn/40 bg-warn/10",
    caption: "The university team has been signalled and can review your offer.",
  },
  UNDER_DISCUSSION: {
    label: "UNDER DISCUSSION",
    tone: "text-azure border-azure/40 bg-azure/10",
    caption: "Conversations are open between your organisation and the team.",
  },
  ACTIVE: {
    label: "COLLABORATION ACTIVE",
    tone: "text-signal border-signal/40 bg-signal/10",
    caption: "Support is committed and the mission is being executed.",
  },
  COMPLETED: {
    label: "COMPLETED",
    tone: "text-cyan border-cyan/40 bg-cyan/10",
    caption: "The university team marked this collaboration complete.",
  },
  DECLINED: {
    label: "WITHDRAWN",
    tone: "text-muted-foreground border-border bg-muted/20",
    caption: "Your organisation stepped away from this opportunity.",
  },
};

/** Status changes the industry side is allowed to make itself. */
export const industryStatusActions: Record<
  CollaborationStatus,
  { to: CollaborationStatus; label: string }[]
> = {
  INTEREST_EXPRESSED: [
    { to: "UNDER_DISCUSSION", label: "MOVE TO DISCUSSION" },
    { to: "DECLINED", label: "WITHDRAW INTEREST" },
  ],
  UNDER_DISCUSSION: [
    { to: "ACTIVE", label: "COMMIT SUPPORT" },
    { to: "DECLINED", label: "WITHDRAW INTEREST" },
  ],
  ACTIVE: [],
  COMPLETED: [],
  DECLINED: [],
};

export const feasibilityTone: Record<string, string> = {
  HIGH: "text-signal",
  MEDIUM: "text-warn",
  LOW: "text-destructive",
};

export const opportunitySortOptions = [
  { id: "newest", label: "Newest first" },
  { id: "impact", label: "Highest estimated impact" },
  { id: "feasibility", label: "Strongest feasibility" },
] as const;

export type OpportunitySort = (typeof opportunitySortOptions)[number]["id"];
