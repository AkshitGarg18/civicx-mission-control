/**
 * TEMPORARY demo-user layer.
 *
 * Authentication is not implemented yet, so the citizen console runs as an
 * unauthenticated visitor. This module is the ONLY place that knows about that
 * fact — once real auth lands, delete this file and have the service layer read
 * the session user id from `supabase.auth.getUser()`.
 */

import { supabase } from "@/integrations/supabase/client";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
}

/** Returns the signed-in user id, or null while auth is not wired up. */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** True while the app has no authenticated session (demo mode). */
export async function isDemoMode(): Promise<boolean> {
  return (await getCurrentUserId()) === null;
}
