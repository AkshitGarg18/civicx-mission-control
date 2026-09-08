/**
 * Emergency response configuration.
 *
 * Every emergency number lives here — never inline in a component — so the
 * directory stays auditable and location aware. Adding a country means adding
 * one entry to `emergencyRegions`.
 */

/** Services the assistant is allowed to recommend. */
export const emergencyServices = [
  "PRIMARY",
  "POLICE",
  "FIRE",
  "AMBULANCE",
  "DISASTER_MANAGEMENT",
  "ROAD_ACCIDENT",
  "LPG_LEAK",
  "CYBER_CRIME",
  "WOMEN_HELPLINE",
  "CHILD_HELPLINE",
  "NONE",
] as const;

export type EmergencyService = (typeof emergencyServices)[number];

export const serviceLabel: Record<EmergencyService, string> = {
  PRIMARY: "Integrated emergency services",
  POLICE: "Police",
  FIRE: "Fire & rescue",
  AMBULANCE: "Ambulance / medical",
  DISASTER_MANAGEMENT: "Disaster management",
  ROAD_ACCIDENT: "Road accident response",
  LPG_LEAK: "LPG / gas leak helpline",
  CYBER_CRIME: "Cyber crime helpline",
  WOMEN_HELPLINE: "Women helpline",
  CHILD_HELPLINE: "Child helpline",
  NONE: "No emergency service required",
};

export type ContactTone = "critical" | "warn" | "info" | "calm";

export interface EmergencyContact {
  id: EmergencyService;
  service: string;
  /** What kind of emergency this line handles. */
  type: string;
  number: string;
  note: string;
  tone: ContactTone;
}

export interface EmergencyRegion {
  id: string;
  label: string;
  country: string;
  /** Single integrated number promoted across the interface. */
  primaryNumber: string;
  contacts: EmergencyContact[];
}

export const emergencyRegions: EmergencyRegion[] = [
  {
    id: "IN",
    label: "India",
    country: "India",
    primaryNumber: "112",
    contacts: [
      {
        id: "PRIMARY",
        service: "Emergency Response Support System",
        type: "All emergencies",
        number: "112",
        note: "Single integrated number for police, fire and medical response.",
        tone: "critical",
      },
      {
        id: "POLICE",
        service: "Police",
        type: "Crime / public safety threat",
        number: "100",
        note: "Immediate threat to people, violence or public disorder.",
        tone: "info",
      },
      {
        id: "FIRE",
        service: "Fire & Rescue",
        type: "Fire / rescue",
        number: "101",
        note: "Active fire, smoke, collapse or people trapped.",
        tone: "critical",
      },
      {
        id: "AMBULANCE",
        service: "Ambulance",
        type: "Medical emergency",
        number: "102",
        note: "Injuries, unconsciousness or any medical emergency.",
        tone: "warn",
      },
      {
        id: "DISASTER_MANAGEMENT",
        service: "Disaster Management",
        type: "Flood / disaster",
        number: "1078",
        note: "Flooding, earthquake, storm or other severe disaster.",
        tone: "warn",
      },
      {
        id: "ROAD_ACCIDENT",
        service: "Road Accident Emergency",
        type: "Road accident",
        number: "1073",
        note: "Highway and road accident assistance.",
        tone: "warn",
      },
      {
        id: "LPG_LEAK",
        service: "LPG Leak Helpline",
        type: "Gas leak",
        number: "1906",
        note: "Suspected LPG or cooking gas leak.",
        tone: "critical",
      },
      {
        id: "CYBER_CRIME",
        service: "Cyber Crime Helpline",
        type: "Cyber crime",
        number: "1930",
        note: "Online fraud and cyber crime reporting.",
        tone: "info",
      },
      {
        id: "WOMEN_HELPLINE",
        service: "Women Helpline",
        type: "Women safety",
        number: "1091",
        note: "Support for women in distress.",
        tone: "calm",
      },
      {
        id: "CHILD_HELPLINE",
        service: "Child Helpline",
        type: "Child safety",
        number: "1098",
        note: "Children in need of care or protection.",
        tone: "calm",
      },
    ],
  },
];

export const defaultRegionId = "IN";

export function regionById(id: string): EmergencyRegion {
  return emergencyRegions.find((r) => r.id === id) ?? emergencyRegions[0]!;
}

/** The contact card for a recommended service, falling back to 112. */
export function contactForService(
  region: EmergencyRegion,
  service: EmergencyService | null,
): EmergencyContact {
  const match = service ? region.contacts.find((c) => c.id === service) : undefined;
  return match ?? region.contacts[0]!;
}

export const contactToneClass: Record<ContactTone, string> = {
  critical: "border-destructive/45 bg-destructive/10 text-destructive",
  warn: "border-warn/45 bg-warn/10 text-warn",
  info: "border-cyan/40 bg-cyan/10 text-cyan",
  calm: "border-signal/40 bg-signal/10 text-signal",
};

/* ---------------- threat classification ---------------- */

export const threatLevels = ["NORMAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ThreatLevel = (typeof threatLevels)[number];

export const threatTone: Record<ThreatLevel, string> = {
  NORMAL: "border-border bg-muted/20 text-muted-foreground",
  LOW: "border-signal/40 bg-signal/10 text-signal",
  MEDIUM: "border-cyan/40 bg-cyan/10 text-cyan",
  HIGH: "border-warn/45 bg-warn/10 text-warn",
  CRITICAL: "border-destructive/50 bg-destructive/10 text-destructive",
};

/** Emergency categories the assessment can assign. */
export const emergencyCategories = [
  { id: "FIRE", emoji: "🔥", label: "Fire" },
  { id: "MEDICAL", emoji: "🚑", label: "Medical emergency" },
  { id: "ACCIDENT", emoji: "🚨", label: "Serious accident" },
  { id: "GAS_LEAK", emoji: "⚠️", label: "Gas / LPG leak" },
  { id: "FLOOD", emoji: "🌊", label: "Flooding / severe disaster" },
  { id: "INFRASTRUCTURE_FAILURE", emoji: "🏗️", label: "Dangerous infrastructure failure" },
  { id: "ELECTRICAL", emoji: "⚡", label: "Electrical hazard" },
  { id: "HAZMAT", emoji: "🧪", label: "Hazardous material incident" },
  { id: "PUBLIC_SAFETY", emoji: "🚔", label: "Immediate public-safety threat" },
  { id: "NATURAL_DISASTER", emoji: "🌪️", label: "Natural disaster" },
  { id: "CIVIC_ISSUE", emoji: "🧰", label: "Regular civic issue" },
] as const;

export type EmergencyCategoryId = (typeof emergencyCategories)[number]["id"];

export function categoryMeta(id: string | null) {
  return emergencyCategories.find((c) => c.id === id) ?? null;
}

/* ---------------- emergency status on a report ---------------- */

export const emergencyStatuses = [
  "NORMAL",
  "HIGH_PRIORITY",
  "POTENTIAL_EMERGENCY",
  "EMERGENCY_ESCALATION_INITIATED",
  "RESOLVED",
] as const;

export type EmergencyStatus = (typeof emergencyStatuses)[number];

export const emergencyStatusLabel: Record<EmergencyStatus, string> = {
  NORMAL: "NORMAL",
  HIGH_PRIORITY: "HIGH PRIORITY",
  POTENTIAL_EMERGENCY: "POTENTIAL EMERGENCY",
  EMERGENCY_ESCALATION_INITIATED: "EMERGENCY ESCALATION INITIATED",
  RESOLVED: "RESOLVED",
};

export const emergencyStatusTone: Record<EmergencyStatus, string> = {
  NORMAL: "border-border bg-muted/20 text-muted-foreground",
  HIGH_PRIORITY: "border-warn/45 bg-warn/10 text-warn",
  POTENTIAL_EMERGENCY: "border-destructive/50 bg-destructive/10 text-destructive",
  EMERGENCY_ESCALATION_INITIATED: "border-destructive/60 bg-destructive/15 text-destructive",
  RESOLVED: "border-signal/40 bg-signal/10 text-signal",
};

export function toEmergencyStatus(raw: string | null | undefined): EmergencyStatus {
  const value = String(raw ?? "NORMAL").toUpperCase();
  return (emergencyStatuses as readonly string[]).includes(value)
    ? (value as EmergencyStatus)
    : "NORMAL";
}

export function toThreatLevel(raw: string | null | undefined): ThreatLevel {
  const value = String(raw ?? "NORMAL").toUpperCase();
  return (threatLevels as readonly string[]).includes(value)
    ? (value as ThreatLevel)
    : "NORMAL";
}

/** A device-handled dial link. The device — never CivicX — places the call. */
export function telHref(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}

export const AI_ADVISORY_NOTE =
  "AI-generated assessment — verify before taking emergency action.";
