/**
 * Client-side helpers for the advisory duplicate layer. Every call runs with
 * the caller's session, so existing Row Level Security decides visibility.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ChallengeRow } from "@/lib/challenges-service";

export interface CanonicalChallenge {
  id: string;
  title: string;
  category: string | null;
  priority: string;
  status: string;
  location_name: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ai_summary: string | null;
  recommended_skills: string[] | null;
  report_count: number;
  created_at: string;
}

/** Record the citizen's decision. Their report is preserved either way. */
export async function setDuplicateLink(
  relationshipId: string,
  linked: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_duplicate_link", {
    _duplicate_id: relationshipId,
    _linked: linked,
  });
  if (error) throw error;
}

/** Non-private roll-up of a canonical challenge the caller may already read. */
export async function getCanonicalChallenge(
  challengeId: string,
): Promise<CanonicalChallenge | null> {
  const { data, error } = await supabase.rpc("get_canonical_challenge", {
    _challenge_id: challengeId,
  });
  if (error) {
    console.error("[civicx] canonical lookup failed", error);
    return null;
  }
  const row = (data as CanonicalChallenge[] | null)?.[0];
  return row ?? null;
}

/** True when this row is a supporting report behind another challenge. */
export const isSupportingReport = (row: ChallengeRow): boolean =>
  !!row.canonical_challenge_id;

/** Canonical challenges only — keeps duplicate missions and pins off screens. */
export function canonicalOnly(rows: ChallengeRow[]): ChallengeRow[] {
  return rows.filter((r) => !r.canonical_challenge_id);
}

/** Human label for the number of citizen reports behind a challenge. */
export function reportCountLabel(row: ChallengeRow): string | null {
  const count = row.report_count ?? 1;
  if (count <= 1) return null;
  return `${count} CITIZEN REPORTS`;
}
