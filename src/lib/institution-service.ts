/**
 * Institution capability reads/writes for the university workflow.
 *
 * Every call runs with the signed-in user's session, so the existing Row Level
 * Security policies decide visibility: only university accounts (and
 * government oversight) can discover university profiles. Citizens cannot.
 */

import { supabase } from "@/integrations/supabase/client";
import type { InstitutionProfile } from "@/lib/institution-matching";

const INSTITUTION_COLUMNS =
  "id, name, institution, district, academic_disciplines, research_areas, faculty_expertise, lab_capabilities, innovation_facilities, tech_capabilities, civic_domains, expertise_areas, skills";

interface InstitutionRow {
  id: string;
  name: string | null;
  institution: string | null;
  district: string | null;
  academic_disciplines: string[] | null;
  research_areas: string[] | null;
  faculty_expertise: string[] | null;
  lab_capabilities: string[] | null;
  innovation_facilities: string[] | null;
  tech_capabilities: string[] | null;
  civic_domains: string[] | null;
  expertise_areas: string[] | null;
  skills: string[] | null;
}

export function toInstitutionProfile(row: InstitutionRow): InstitutionProfile {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    district: row.district,
    academicDisciplines: row.academic_disciplines ?? [],
    researchAreas: row.research_areas ?? [],
    facultyExpertise: row.faculty_expertise ?? [],
    labCapabilities: row.lab_capabilities ?? [],
    innovationFacilities: row.innovation_facilities ?? [],
    techCapabilities: row.tech_capabilities ?? [],
    civicDomains: row.civic_domains ?? [],
    expertiseAreas: row.expertise_areas ?? [],
    skills: row.skills ?? [],
  };
}

/** University profiles this session is permitted to discover. */
export async function getDiscoverableInstitutions(): Promise<InstitutionProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(INSTITUTION_COLUMNS)
    .eq("role", "university");

  if (error) throw error;
  return (data ?? []).map((row) => toInstitutionProfile(row as InstitutionRow));
}

export interface InstitutionEdit {
  district: string | null;
  academicDisciplines: string[];
  researchAreas: string[];
  facultyExpertise: string[];
  labCapabilities: string[];
  innovationFacilities: string[];
  techCapabilities: string[];
  civicDomains: string[];
}

/** Save institution capabilities on the caller's own profile row only. */
export async function updateMyInstitution(
  userId: string,
  edit: InstitutionEdit,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      district: edit.district,
      academic_disciplines: edit.academicDisciplines,
      research_areas: edit.researchAreas,
      faculty_expertise: edit.facultyExpertise,
      lab_capabilities: edit.labCapabilities,
      innovation_facilities: edit.innovationFacilities,
      tech_capabilities: edit.techCapabilities,
      civic_domains: edit.civicDomains,
    })
    .eq("id", userId);

  if (error) {
    console.error("[civicx] institution profile update failed", error);
    throw new Error("We could not save your institution profile. Please try again.");
  }
}

/** Parse a comma or newline separated capability field into a clean list. */
export function parseList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n]/)) {
    const value = part.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}
