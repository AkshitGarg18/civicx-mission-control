/**
 * Deterministic institution (Level 1) matching for CivicX.
 *
 * The score is plain, explainable arithmetic over capability data that is
 * actually stored on a university profile — the model never invents a
 * percentage and never invents a capability. Components with no data are
 * excluded and the remaining weights are renormalised, so a missing dimension
 * can never be rewarded with a perfect score.
 *
 * This module is pure and shared by the server function and the UI.
 */

export interface ChallengeRequirements {
  /** Primary civic domain, e.g. "Water Management". */
  primaryDomain: string | null;
  domains: string[];
  disciplines: string[];
  skills: string[];
  researchAreas: string[];
  technologies: string[];
  facilities: string[];
  needsIncubation: boolean;
  /** District / city / locality text taken from the challenge row. */
  locationTerms: string[];
}

/** Capability view of a university profile, exactly as stored. */
export interface InstitutionProfile {
  id: string;
  name: string | null;
  institution: string | null;
  district: string | null;
  academicDisciplines: string[];
  researchAreas: string[];
  facultyExpertise: string[];
  labCapabilities: string[];
  innovationFacilities: string[];
  techCapabilities: string[];
  civicDomains: string[];
  expertiseAreas: string[];
  /** Student/faculty skills stored on the same profile row. */
  skills: string[];
}

export interface ScoreComponent {
  id: "domain" | "skills" | "research" | "innovation" | "geography";
  label: string;
  weight: number;
  /** 0-1, or null when there is nothing to compare. */
  ratio: number | null;
  matched: string[];
  missing: string[];
}

export interface InstitutionScore {
  /** 0-100, or null when the institution profile has no comparable data. */
  percent: number | null;
  components: ScoreComponent[];
  matchedCapabilities: string[];
  missingCapabilities: string[];
  /** Discipline/domain labels this institution actually holds. */
  primaryDomains: string[];
}

export const COMPONENT_WEIGHTS = {
  domain: 0.4,
  skills: 0.25,
  research: 0.15,
  innovation: 0.1,
  geography: 0.1,
} as const;

const clean = (list: (string | null | undefined)[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const value = (raw ?? "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
};

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Words that carry no subject meaning on their own. Without this list
 * "Waste Management" would match "Water Management" on the shared word
 * "management", which would inflate scores across unrelated domains.
 */
const GENERIC_TOKENS = new Set([
  "management", "engineering", "science", "sciences", "studies", "technology",
  "technologies", "system", "systems", "design", "assessment", "analysis",
  "analytics", "planning", "operations", "coordination", "services", "support",
  "research", "lab", "laboratory", "development", "applied", "general",
  "programme", "program", "solutions", "monitoring", "centre", "center",
]);

const meaningfulTokens = (value: string): Set<string> =>
  new Set(
    value
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3 && !GENERIC_TOKENS.has(t)),
  );

/** Tolerant label comparison, in the spirit of the student skill matcher. */
function sameLabel(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (x === y) return true;
  if (x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x))) return true;
  // subject-word overlap for multi-word labels ("urban water supply" vs "water supply")
  const ax = meaningfulTokens(x);
  const by = meaningfulTokens(y);
  if (ax.size === 0 || by.size === 0) return false;
  for (const t of ax) if (by.has(t)) return true;
  return false;
}

function coverage(
  required: string[],
  pool: string[],
): { ratio: number | null; matched: string[]; missing: string[] } {
  const req = clean(required);
  if (req.length === 0 || pool.length === 0) {
    return { ratio: null, matched: [], missing: req };
  }
  const matched = req.filter((r) => pool.some((p) => sameLabel(p, r)));
  return {
    ratio: matched.length / req.length,
    matched,
    missing: req.filter((r) => !matched.includes(r)),
  };
}

/** Geographic relevance from stored district / institution text only. */
function geographyRatio(
  profile: InstitutionProfile,
  locationTerms: string[],
): number | null {
  const terms = clean(locationTerms);
  const own = clean([profile.district, profile.institution]);
  if (terms.length === 0 || own.length === 0) return null;
  const hit = terms.some((t) => own.some((o) => sameLabel(o, t)));
  return hit ? 1 : 0.25; // a distant institution can still contribute, just less
}

/**
 * Institution match score. Weighting: 40% domain expertise, 25% required
 * skills/capabilities, 15% research expertise, 10% innovation/incubation,
 * 10% geographic relevance — renormalised over components that have data.
 */
export function scoreInstitution(
  profile: InstitutionProfile,
  req: ChallengeRequirements,
): InstitutionScore {
  const domainPool = clean([
    ...profile.civicDomains,
    ...profile.academicDisciplines,
    ...profile.facultyExpertise,
    ...profile.expertiseAreas,
  ]);
  const skillPool = clean([
    ...profile.techCapabilities,
    ...profile.labCapabilities,
    ...profile.skills,
  ]);
  const researchPool = clean([...profile.researchAreas, ...profile.facultyExpertise]);
  const innovationPool = clean([
    ...profile.innovationFacilities,
    ...profile.labCapabilities,
  ]);

  const domain = coverage([...req.domains, ...req.disciplines], domainPool);
  const skills = coverage([...req.skills, ...req.technologies], skillPool);
  const research = coverage(req.researchAreas, researchPool);
  const innovation = req.needsIncubation
    ? coverage(req.facilities.length > 0 ? req.facilities : ["Innovation / incubation support"], innovationPool)
    : coverage(req.facilities, innovationPool);

  const components: ScoreComponent[] = [
    {
      id: "domain",
      label: "DOMAIN EXPERTISE",
      weight: COMPONENT_WEIGHTS.domain,
      ...domain,
    },
    {
      id: "skills",
      label: "REQUIRED CAPABILITIES",
      weight: COMPONENT_WEIGHTS.skills,
      ...skills,
    },
    {
      id: "research",
      label: "RESEARCH EXPERTISE",
      weight: COMPONENT_WEIGHTS.research,
      ...research,
    },
    {
      id: "innovation",
      label: "INNOVATION / INCUBATION",
      weight: COMPONENT_WEIGHTS.innovation,
      ...innovation,
    },
    {
      id: "geography",
      label: "GEOGRAPHIC RELEVANCE",
      weight: COMPONENT_WEIGHTS.geography,
      ratio: geographyRatio(profile, req.locationTerms),
      matched: [],
      missing: [],
    },
  ];

  const scored = components.filter((c) => c.ratio !== null);
  const totalWeight = scored.reduce((sum, c) => sum + c.weight, 0);
  const percent =
    totalWeight === 0
      ? null
      : Math.round(
          (scored.reduce((sum, c) => sum + c.weight * (c.ratio ?? 0), 0) / totalWeight) *
            100,
        );

  const matchedCapabilities = clean(components.flatMap((c) => c.matched));
  const missingCapabilities = clean(
    components.flatMap((c) => (c.ratio === null ? [] : c.missing)),
  );

  return {
    percent,
    components,
    matchedCapabilities,
    missingCapabilities,
    primaryDomains: clean([
      ...profile.civicDomains,
      ...profile.academicDisciplines,
      ...profile.expertiseAreas,
    ]).slice(0, 3),
  };
}

/** True when a profile carries any institution-level capability data. */
export function hasInstitutionData(profile: InstitutionProfile): boolean {
  return (
    profile.academicDisciplines.length > 0 ||
    profile.researchAreas.length > 0 ||
    profile.facultyExpertise.length > 0 ||
    profile.labCapabilities.length > 0 ||
    profile.innovationFacilities.length > 0 ||
    profile.techCapabilities.length > 0 ||
    profile.civicDomains.length > 0 ||
    !!profile.district
  );
}

/**
 * Requirements derived from the stored challenge alone, with no model call.
 * Used for the lightweight indicator on mission cards.
 */
export function baselineRequirements(row: {
  category: string | null;
  recommended_skills: string[] | null;
  city: string | null;
  locality: string | null;
  state: string | null;
  location_name: string | null;
}): ChallengeRequirements {
  const domains = clean([row.category]);
  return {
    primaryDomain: domains[0] ?? null,
    domains,
    disciplines: [],
    skills: clean(row.recommended_skills ?? []),
    researchAreas: [],
    technologies: [],
    facilities: [],
    needsIncubation: false,
    locationTerms: clean([row.city, row.locality, row.state, row.location_name]),
  };
}
