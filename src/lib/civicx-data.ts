export type ChallengeCategory =
  | "Water"
  | "Waste"
  | "Education"
  | "Healthcare"
  | "Infrastructure"
  | "Safety";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM";

export type MissionStatus =
  | "SIGNAL DETECTED"
  | "AI ANALYSIS COMPLETE"
  | "MATCHING IN PROGRESS"
  | "TEAM FOUND"
  | "INDUSTRY SUPPORT AVAILABLE"
  | "MISSION ACTIVE"
  | "MISSION COMPLETED";

export interface ChallengeNode {
  id: string;
  /** mission code, e.g. MISSION #0421 */
  code: string;
  name: string;
  location: string;
  category: ChallengeCategory;
  priority: Priority;
  affected: string;
  status: MissionStatus;
  /** AI confidence, 0-100 */
  confidence: number;
  description: string;
  aiAnalysis: string;
  skills: string[];
  /** percentage coordinates inside the visual canvas */
  x: number;
  y: number;
}

/** Ordered lifecycle stages every challenge moves through. */
export const lifecycleStages = [
  "REPORT",
  "AI ANALYSIS",
  "MATCHING",
  "COLLABORATION",
  "IMPACT",
] as const;

/** Maps a mission status onto the lifecycle stage index it sits in. */
export const statusStage: Record<MissionStatus, number> = {
  "SIGNAL DETECTED": 0,
  "AI ANALYSIS COMPLETE": 1,
  "MATCHING IN PROGRESS": 2,
  "TEAM FOUND": 2,
  "INDUSTRY SUPPORT AVAILABLE": 3,
  "MISSION ACTIVE": 3,
  "MISSION COMPLETED": 4,
};

/** Hero constellation nodes (abstract network view) */
export const heroNodes: ChallengeNode[] = [
  {
    id: "h1",
    code: "MISSION #0182",
    name: "Water Crisis",
    location: "Jaipur, Rajasthan",
    category: "Water",
    priority: "CRITICAL",
    affected: "48,200 people",
    status: "MATCHING IN PROGRESS",
    confidence: 94,
    description: "Municipal supply lines run dry for 14 hours a day across four wards, pushing households onto paid tankers.",
    aiAnalysis: "Classified as water scarcity with distribution loss as the dominant factor. Similar patterns resolved through pressure-zone mapping.",
    skills: ["Hydrology", "GIS mapping", "Civil engineering", "Data analysis"],
    x: 28,
    y: 22,
  },
  {
    id: "h2",
    code: "MISSION #0421",
    name: "Waste Management",
    location: "Rohini, Delhi",
    category: "Waste",
    priority: "HIGH",
    affected: "12,400 people",
    status: "TEAM FOUND",
    confidence: 91,
    description: "An informal landfill beside a residential block overflows weekly, with leachate reaching a storm drain.",
    aiAnalysis: "Categorised as environmental — solid waste. Collection frequency and segregation gaps identified as root causes.",
    skills: ["Environmental engineering", "Route optimisation", "Community outreach"],
    x: 66,
    y: 15,
  },
  {
    id: "h3",
    code: "MISSION #0507",
    name: "Traffic Congestion",
    location: "Bengaluru, Karnataka",
    category: "Infrastructure",
    priority: "HIGH",
    affected: "310,000 people",
    status: "MISSION ACTIVE",
    confidence: 88,
    description: "Peak-hour travel time on a 6 km corridor has tripled in three years, with unsignalled junctions creating gridlock.",
    aiAnalysis: "Classified as urban mobility. Signal timing and junction geometry flagged as highest-leverage interventions.",
    skills: ["Transport modelling", "Computer vision", "Urban planning"],
    x: 78,
    y: 46,
  },
  {
    id: "h4",
    code: "MISSION #0333",
    name: "Public Safety",
    location: "Kanpur, Uttar Pradesh",
    category: "Safety",
    priority: "MEDIUM",
    affected: "27,600 people",
    status: "AI ANALYSIS COMPLETE",
    confidence: 83,
    description: "Unlit corridors near two transit stops have become avoidance zones for residents after dark.",
    aiAnalysis: "Categorised as public safety with lighting infrastructure as the primary contributing factor.",
    skills: ["IoT sensing", "Electrical engineering", "Urban design"],
    x: 46,
    y: 52,
  },
  {
    id: "h5",
    code: "MISSION #0290",
    name: "Education Access",
    location: "Patna, Bihar",
    category: "Education",
    priority: "HIGH",
    affected: "63,900 students",
    status: "INDUSTRY SUPPORT AVAILABLE",
    confidence: 90,
    description: "Secondary dropout climbs sharply after grade 8, concentrated in schools without science labs.",
    aiAnalysis: "Classified as education access. Attendance and resource-availability data show strong correlation.",
    skills: ["Education research", "Statistics", "Curriculum design"],
    x: 20,
    y: 66,
  },
  {
    id: "h6",
    code: "MISSION #0466",
    name: "Healthcare Delay",
    location: "Nagpur, Maharashtra",
    category: "Healthcare",
    priority: "CRITICAL",
    affected: "91,300 people",
    status: "MISSION ACTIVE",
    confidence: 96,
    description: "Emergency response in the outer ring exceeds 28 minutes, well past the critical care window.",
    aiAnalysis: "Categorised as healthcare logistics. Dispatch routing identified as the dominant delay source.",
    skills: ["Operations research", "Health systems", "Mobile development"],
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
  {
    id: "m1",
    code: "MISSION #0388",
    name: "Groundwater Depletion",
    location: "Ahmedabad, Gujarat",
    category: "Water",
    priority: "CRITICAL",
    affected: "120,000",
    status: "MISSION ACTIVE",
    confidence: 95,
    description: "The water table has dropped 18 metres in a decade across the western industrial belt.",
    aiAnalysis: "Classified as water scarcity — extraction imbalance. Recharge structures rated highest impact.",
    skills: ["Hydrogeology", "Remote sensing", "Policy analysis"],
    x: 26,
    y: 44,
  },
  {
    id: "m2",
    code: "MISSION #0421",
    name: "Landfill Overflow",
    location: "Rohini, Delhi",
    category: "Waste",
    priority: "HIGH",
    affected: "12,400",
    status: "TEAM FOUND",
    confidence: 91,
    description: "An informal landfill beside a residential block overflows weekly, with leachate reaching a storm drain.",
    aiAnalysis: "Categorised as environmental — solid waste. Segregation gaps identified as root cause.",
    skills: ["Environmental engineering", "Route optimisation"],
    x: 38,
    y: 24,
  },
  {
    id: "m3",
    code: "MISSION #0290",
    name: "School Dropout Rate",
    location: "Patna, Bihar",
    category: "Education",
    priority: "HIGH",
    affected: "63,900",
    status: "INDUSTRY SUPPORT AVAILABLE",
    confidence: 90,
    description: "Secondary dropout climbs sharply after grade 8 in schools without science labs.",
    aiAnalysis: "Classified as education access with resource availability as key factor.",
    skills: ["Education research", "Statistics"],
    x: 62,
    y: 34,
  },
  {
    id: "m4",
    code: "MISSION #0511",
    name: "Rural Clinic Access",
    location: "Raipur, Chhattisgarh",
    category: "Healthcare",
    priority: "CRITICAL",
    affected: "91,300",
    status: "MATCHING IN PROGRESS",
    confidence: 93,
    description: "Villages in three blocks travel over 30 km to reach the nearest staffed clinic.",
    aiAnalysis: "Categorised as healthcare access. Facility distribution flagged as primary constraint.",
    skills: ["Health systems", "Geospatial analysis"],
    x: 55,
    y: 50,
  },
  {
    id: "m5",
    code: "MISSION #0182",
    name: "Flooded Underpasses",
    location: "Mumbai, Maharashtra",
    category: "Infrastructure",
    priority: "HIGH",
    affected: "210,000",
    status: "AI ANALYSIS COMPLETE",
    confidence: 89,
    description: "Four underpasses flood within 40 minutes of heavy rainfall, cutting two arterial routes.",
    aiAnalysis: "Classified as drainage capacity failure, with pump maintenance cycles as a compounding factor.",
    skills: ["Civil engineering", "Hydraulics", "Sensor networks"],
    x: 28,
    y: 60,
  },
  {
    id: "m6",
    code: "MISSION #0333",
    name: "Unlit Street Corridors",
    location: "Kanpur, Uttar Pradesh",
    category: "Safety",
    priority: "MEDIUM",
    affected: "27,600",
    status: "SIGNAL DETECTED",
    confidence: 81,
    description: "Unlit corridors near two transit stops have become avoidance zones after dark.",
    aiAnalysis: "Categorised as public safety — lighting infrastructure.",
    skills: ["IoT sensing", "Electrical engineering"],
    x: 47,
    y: 30,
  },
  {
    id: "m7",
    code: "MISSION #0604",
    name: "Lake Contamination",
    location: "Bengaluru, Karnataka",
    category: "Water",
    priority: "HIGH",
    affected: "88,000",
    status: "MISSION ACTIVE",
    confidence: 92,
    description: "Untreated inflow has left a 40-hectare lake with recurring foam and fish kills.",
    aiAnalysis: "Classified as water quality — untreated discharge upstream.",
    skills: ["Environmental chemistry", "Bioremediation"],
    x: 40,
    y: 76,
  },
  {
    id: "m8",
    code: "MISSION #0219",
    name: "E-Waste Dumping",
    location: "Chennai, Tamil Nadu",
    category: "Waste",
    priority: "MEDIUM",
    affected: "31,500",
    status: "MATCHING IN PROGRESS",
    confidence: 85,
    description: "Informal e-waste burning on the city fringe releases heavy metals into nearby farmland.",
    aiAnalysis: "Categorised as hazardous waste with informal recycling networks as key actor.",
    skills: ["Materials science", "Public health", "Policy analysis"],
    x: 48,
    y: 84,
  },
  {
    id: "m9",
    code: "MISSION #0348",
    name: "Digital Learning Gap",
    location: "Guwahati, Assam",
    category: "Education",
    priority: "MEDIUM",
    affected: "22,100",
    status: "SIGNAL DETECTED",
    confidence: 78,
    description: "Only one in five schools in the district has usable bandwidth for digital coursework.",
    aiAnalysis: "Classified as education infrastructure — connectivity limited.",
    skills: ["Network engineering", "Ed-tech design"],
    x: 80,
    y: 33,
  },
  {
    id: "m10",
    code: "MISSION #0507",
    name: "Ambulance Response Time",
    location: "Hyderabad, Telangana",
    category: "Healthcare",
    priority: "HIGH",
    affected: "140,000",
    status: "INDUSTRY SUPPORT AVAILABLE",
    confidence: 94,
    description: "Emergency response in the outer ring exceeds 28 minutes, past the critical care window.",
    aiAnalysis: "Categorised as healthcare logistics. Dispatch routing is the dominant delay source.",
    skills: ["Operations research", "Mobile development"],
    x: 44,
    y: 66,
  },
  {
    id: "m11",
    code: "MISSION #0175",
    name: "Bridge Structural Risk",
    location: "Kolkata, West Bengal",
    category: "Infrastructure",
    priority: "CRITICAL",
    affected: "175,000",
    status: "MISSION ACTIVE",
    confidence: 97,
    description: "A 1970s road bridge carrying 40,000 vehicles daily shows advancing corrosion on its main span.",
    aiAnalysis: "Classified as structural risk — inspection intervals exceeded.",
    skills: ["Structural engineering", "Non-destructive testing"],
    x: 70,
    y: 47,
  },
  {
    id: "m12",
    code: "MISSION #0262",
    name: "Night Transit Safety",
    location: "Pune, Maharashtra",
    category: "Safety",
    priority: "MEDIUM",
    affected: "54,800",
    status: "MISSION COMPLETED",
    confidence: 86,
    description: "Late-shift workers reported unsafe waiting conditions at six bus interchanges.",
    aiAnalysis: "Categorised as transit safety. Wait-time exposure and lighting flagged together.",
    skills: ["Urban design", "Service design", "Data analysis"],
    x: 31,
    y: 66,
  },
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
  location: string;
  priority: Priority;
  impact: string;
  status: MissionStatus;
  /** AI classification confidence, 0-100 */
  confidence: number;
  progress: number;
  category: ChallengeCategory;
  /** revealed on hover */
  detail: string;
  skills: string[];
}

export const missions: Mission[] = [
  {
    code: "MISSION #0421",
    title: "Reduce Waste Overflow in Rohini",
    location: "Rohini, Delhi",
    priority: "HIGH",
    impact: "12,400 citizens",
    status: "MATCHING IN PROGRESS",
    confidence: 94,
    progress: 34,
    category: "Waste",
    detail:
      "Weekly overflow at an informal landfill is pushing leachate into a storm drain beside homes.",
    skills: ["Environmental engineering", "Route optimisation"],
  },
  {
    code: "MISSION #0388",
    title: "Restore Groundwater Table in Ahmedabad West",
    location: "Ahmedabad, Gujarat",
    priority: "CRITICAL",
    impact: "120,000 citizens",
    status: "MISSION ACTIVE",
    confidence: 95,
    progress: 62,
    category: "Water",
    detail:
      "The water table has fallen 18 metres in a decade; recharge structures are being piloted with a student team.",
    skills: ["Hydrogeology", "Remote sensing"],
  },
  {
    code: "MISSION #0507",
    title: "Cut Ambulance Response Time in Hyderabad",
    location: "Hyderabad, Telangana",
    priority: "HIGH",
    impact: "140,000 citizens",
    status: "INDUSTRY SUPPORT AVAILABLE",
    confidence: 92,
    progress: 48,
    category: "Healthcare",
    detail:
      "Dispatch routing is the dominant delay; a logistics partner has offered mentorship for the pilot.",
    skills: ["Operations research", "Mobile development"],
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

export interface Signal {
  kind: MissionStatus;
  detail: string;
}

/** Demo activity feed events for the LIVE SIGNALS panel. */
export const signalFeed: Signal[] = [
  { kind: "SIGNAL DETECTED", detail: "Water contamination reported in Delhi" },
  { kind: "AI ANALYSIS COMPLETE", detail: "Challenge classified as Environmental" },
  { kind: "TEAM FOUND", detail: "3 student teams matched in Bengaluru" },
  { kind: "INDUSTRY SUPPORT AVAILABLE", detail: "Mentorship offered by a partner organisation" },
  { kind: "MISSION COMPLETED", detail: "Community waste-management project delivered" },
  { kind: "SIGNAL DETECTED", detail: "Unlit transit corridor reported in Kanpur" },
  { kind: "MATCHING IN PROGRESS", detail: "Searching hydrology expertise near Ahmedabad" },
  { kind: "MISSION ACTIVE", detail: "Bridge inspection pilot underway in Kolkata" },
  { kind: "AI ANALYSIS COMPLETE", detail: "Challenge classified as Healthcare logistics" },
];

export const categoryAccent: Record<ChallengeCategory, string> = {
  Water: "var(--neon-cyan)",
  Waste: "var(--warn)",
  Education: "var(--neon-violet)",
  Healthcare: "var(--signal)",
  Infrastructure: "var(--neon-azure)",
  Safety: "var(--destructive)",
};
