/**
 * Profile writes for the signed-in operator. The `role` column is deliberately
 * never sent — a database trigger blocks role changes, so privilege escalation
 * is impossible from the client.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ProfileEdit {
  name: string | null;
  institution: string | null;
  course: string | null;
  year: string | null;
  bio: string | null;
  skills: string[];
}

/** Parse a comma or newline separated skills field into a clean list. */
export function parseSkills(raw: string): string[] {
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

export async function updateMyProfile(userId: string, edit: ProfileEdit): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      name: edit.name,
      institution: edit.institution,
      course: edit.course,
      year: edit.year,
      bio: edit.bio,
      skills: edit.skills,
    })
    .eq("id", userId);

  if (error) {
    console.error("[civicx] profile update failed", error);
    throw new Error("We could not save your profile. Please try again.");
  }
}
