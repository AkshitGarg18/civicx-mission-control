export type ChallengeCategory =
  | "Water"
  | "Waste"
  | "Education"
  | "Healthcare"
  | "Infrastructure"
  | "Safety";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM";

export interface ChallengeNode {
  id: string;
  name: string;
  location: string;
  category: ChallengeCategory;
  priority: Priority;
  affected: string;
  /** percentage coordinates inside the visual canvas */
  x: number;
  y: number;
}

/** Hero constellation nodes (abstract network view) */
export const heroNodes: ChallengeNode[] = [
  {
    id: "h1",
    name: "Water Crisis",
    location: "Jaipur, Rajasthan",
    category: "Water",
    priority: "CRITICAL",
    affected: "48,200 people",
    x: 28,
    y: 22,
  },
  {
    id: "h2",
    name: "Waste Management",
    location: "Rohini, Delhi",
    category: "Waste",
    priority: "HIGH",
    affected: "12,400 people",
    x: 66,
    y: 15,
  },
  {
    id: "h3",
    name: "Traffic",
    location: "Bengaluru, Karnataka",
    category: "Infrastructure",
    priority: "HIGH",
    affected: "310,000 people",
    x: 78,
    y: 46,
  },
  {
    id: "h4",
    name: "Public Safety",
    location: "Kanpur, Uttar Pradesh",
    category: "Safety",
    priority: "MEDIUM",
    affected: "27,600 people",
    x: 46,
    y: 52,
  },
  {
    id: "h5",
    name: "Education",
    location: "Patna, Bihar",
    category: "Education",
    priority: "HIGH",
    affected: "63,900 students",
    x: 20,
    y: 66,
  },
  {
    id: "h6",
    name: "Healthcare",
    location: "Nagpur, Maharashtra",
    category: "Healthcare",
    priority: "CRITICAL",
    affected: "91,300 people",
    x: 62,
    y: 78,
  },
];

export const heroLinks: [string, string][] = [
  ["h1", "h2"],
  ["h2", "h3"],
  ["h1", "h4"],
  ["h4", "h3"],
  ["h4", "h5"],
  ["h4", "h6"],
  ["h6", "h3"],
  ["h5", "h1"],
];

/** Live-world map nodes, positioned over an abstract India silhouette */
export const mapNodes: ChallengeNode[] = [
  { id: "m1", name: "Groundwater Depletion", location: "Ahmedabad, GJ", category: "Water", priority: "CRITICAL", affected: "120,000", x: 26, y: 44 },
  { id: "m2", name: "Landfill Overflow", location: "Rohini, DL", category: "Waste", priority: "HIGH", affected: "12,400", x: 38, y: 24 },
  { id: "m3", name: "School Dropout Rate", location: "Patna, BR", category: "Education", priority: "HIGH", affected: "63,900", x: 62, y: 34 },
  { id: "m4", name: "Rural Clinic Access", location: "Raipur, CG", category: "Healthcare", priority: "CRITICAL", affected: "91,300", x: 55, y: 50 },
  { id: "m5", name: "Flooded Underpasses", location: "Mumbai, MH", category: "Infrastructure", priority: "HIGH", affected: "210,000", x: 28, y: 60 },
  { id: "m6", name: "Unlit Street Corridors", location: "Kanpur, UP", category: "Safety", priority: "MEDIUM", affected: "27,600", x: 47, y: 30 },
  { id: "m7", name: "Lake Contamination", location: "Bengaluru, KA", category: "Water", priority: "HIGH", affected: "88,000", x: 40, y: 76 },
  { id: "m8", name: "E-Waste Dumping", location: "Chennai, TN", category: "Waste", priority: "MEDIUM", affected: "31,500", x: 48, y: 84 },
  { id: "m9", name: "Digital Learning Gap", location: "Guwahati, AS", category: "Education", priority: "MEDIUM", affected: "22,100", x: 80, y: 33 },
  { id: "m10", name: "Ambulance Response Time", location: "Hyderabad, TS", category: "Healthcare", priority: "HIGH", affected: "140,000", x: 44, y: 66 },
  { id: "m11", name: "Bridge Structural Risk", location: "Kolkata, WB", category: "Infrastructure", priority: "CRITICAL", affected: "175,000", x: 70, y: 47 },
  { id: "m12", name: "Night Transit Safety", location: "Pune, MH", category: "Safety", priority: "MEDIUM", affected: "54,800", x: 31, y: 66 },
];

export const categories: ("All" | ChallengeCategory)[] = [
  "All",
  "Water",
  "Waste",
  "Education",
  "Healthcare",
  "Infrastructure",
  "Safety",
];

export const liveStats = [
  { label: "Active Challenges", value: 1284, suffix: "" },
  { label: "Solutions in Progress", value: 327, suffix: "" },
  { label: "Completed", value: 891, suffix: "" },
  { label: "People Impacted", value: 2.4, suffix: "M+", decimals: 1 },
];

export interface Mission {
  code: string;
  title: string;
  priority: Priority;
  impact: string;
  status: string;
  progress: number;
  category: ChallengeCategory;
}

export const missions: Mission[] = [
  {
    code: "MISSION #0421",
    title: "Reduce Waste Overflow in Rohini",
    priority: "HIGH",
    impact: "12,400 citizens",
    status: "MATCHING UNIVERSITY TEAM",
    progress: 34,
    category: "Waste",
  },
  {
    code: "MISSION #0388",
    title: "Restore Groundwater Table in Ahmedabad West",
    priority: "CRITICAL",
    impact: "120,000 citizens",
    status: "SOLUTION IN DEVELOPMENT",
    progress: 62,
    category: "Water",
  },
  {
    code: "MISSION #0507",
    title: "Cut Ambulance Response Time in Hyderabad",
    priority: "HIGH",
    impact: "140,000 citizens",
    status: "INDUSTRY MENTOR ASSIGNED",
    progress: 48,
    category: "Healthcare",
  },
];

export const forces = [
  {
    key: "CITIZENS",
    line: "Identify the problem.",
    detail: "Geo-tagged reports from the ground, verified by community signal.",
  },
  {
    key: "UNIVERSITIES",
    line: "Build the solution.",
    detail: "Student teams matched to challenges by domain expertise.",
  },
  {
    key: "INDUSTRY",
    line: "Accelerate the solution.",
    detail: "Mentorship, tooling and resources to move from prototype to pilot.",
  },
  {
    key: "GOVERNMENT",
    line: "Measure the impact.",
    detail: "Lifecycle oversight with auditable, measurable outcomes.",
  },
];

export const steps = [
  { no: "01", title: "REPORT", copy: "Citizen identifies a challenge." },
  { no: "02", title: "ANALYZE", copy: "AI understands and categorizes it." },
  { no: "03", title: "MATCH", copy: "The platform finds relevant university expertise." },
  { no: "04", title: "COLLABORATE", copy: "Students and industry work together." },
  { no: "05", title: "IMPACT", copy: "Government tracks measurable results." },
];

export const categoryAccent: Record<ChallengeCategory, string> = {
  Water: "var(--neon-cyan)",
  Waste: "var(--warn)",
  Education: "var(--neon-violet)",
  Healthcare: "var(--signal)",
  Infrastructure: "var(--neon-azure)",
  Safety: "var(--destructive)",
};
