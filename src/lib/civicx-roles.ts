import { Building2, GraduationCap, Landmark, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type RoleId = "citizen" | "university" | "industry" | "government";

export interface RoleDefinition {
  id: RoleId;
  /** dashboard route for this role */
  to: "/citizen" | "/university" | "/industry" | "/government";
  title: string;
  icon: LucideIcon;
  description: string;
  tags: [string, string, string];
  cta: string;
  /** css custom property holding the accent colour */
  accent: string;
  /** foreground utility matched to the accent token */
  textClass: string;
  /** short mission-control caption for the dashboard placeholder */
  caption: string;
}

export const roles: RoleDefinition[] = [
  {
    id: "citizen",
    to: "/citizen",
    title: "CITIZEN",
    icon: Users,
    description:
      "Report problems in your community and help bring real-world challenges to the people who can solve them.",
    tags: ["REPORT", "TRACK", "IMPACT"],
    cta: "ENTER AS CITIZEN",
    accent: "var(--neon-cyan)",
    textClass: "text-cyan",
    caption: "Signal intake and community reporting console.",
  },
  {
    id: "university",
    to: "/university",
    title: "UNIVERSITY",
    icon: GraduationCap,
    description:
      "Discover challenges that match your students' expertise and build teams to create solutions.",
    tags: ["DISCOVER", "BUILD", "COLLABORATE"],
    cta: "ENTER AS UNIVERSITY",
    accent: "var(--neon-azure)",
    textClass: "text-azure",
    caption: "Challenge matching and student team deployment.",
  },
  {
    id: "industry",
    to: "/industry",
    title: "INDUSTRY",
    icon: Building2,
    description:
      "Find promising solutions and accelerate them through mentorship, resources, technology and funding.",
    tags: ["MENTOR", "ACCELERATE", "INVEST"],
    cta: "ENTER AS INDUSTRY",
    accent: "var(--warn)",
    textClass: "text-warn",
    caption: "Solution acceleration, mentorship and resource pipeline.",
  },
  {
    id: "government",
    to: "/government",
    title: "GOVERNMENT",
    icon: Landmark,
    description:
      "Monitor societal challenges, coordinate stakeholders and measure real-world impact.",
    tags: ["MONITOR", "COORDINATE", "MEASURE"],
    cta: "ENTER AS GOVERNMENT",
    accent: "var(--neon-violet)",
    textClass: "text-violet",
    caption: "Oversight, coordination and verified impact measurement.",
  },
];

export const roleById: Record<RoleId, RoleDefinition> = roles.reduce(
  (acc, r) => ({ ...acc, [r.id]: r }),
  {} as Record<RoleId, RoleDefinition>,
);

/** Demo network telemetry shown on the access screen. */
export const networkStatus = [
  { label: "ACTIVE MISSIONS", value: 1284 },
  { label: "SOLUTIONS IN PROGRESS", value: 327 },
  { label: "MISSIONS COMPLETED", value: 891 },
];
