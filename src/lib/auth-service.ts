import { supabase } from "@/integrations/supabase/client";
import { ensureProfile } from "@/lib/auth-context";
import type { RoleId } from "@/lib/civicx-roles";

/**
 * Auth calls used by the /login and /signup screens. All Supabase error text is
 * translated here so the UI never surfaces raw technical messages.
 */

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: RoleId;
  institution?: string | undefined;
}

export interface AuthOutcome {
  ok: boolean;
  /** user-facing message; only set when ok === false */
  message?: string;
  /** true when the account was created but needs email confirmation */
  needsConfirmation?: boolean;
  role?: RoleId;
}

function friendly(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Access denied — that email and password combination was not recognised.";
  if (m.includes("email not confirmed"))
    return "This account still needs to be confirmed. Check your inbox for the confirmation link.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account already exists for this email. Try signing in instead.";
  if (m.includes("password") && m.includes("6"))
    return "Password must be at least 6 characters long.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Wait a moment and try again.";
  if (m.includes("invalid") && m.includes("email"))
    return "That email address does not look valid.";
  if (m.includes("network") || m.includes("fetch"))
    return "Could not reach the CivicX network. Check your connection and retry.";
  return "Something went wrong while contacting the network. Please try again.";
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthOutcome> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, message: friendly(error.message) };
  if (!data.user) return { ok: false, message: "Access denied. Please try again." };

  const profile = await ensureProfile(data.user);
  return { ok: true, role: profile.role };
}

export async function signUpWithEmail(input: SignUpInput): Promise<AuthOutcome> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        name: input.name.trim(),
        role: input.role,
        institution: input.institution?.trim() || null,
      },
    },
  });

  if (error) return { ok: false, message: friendly(error.message) };
  if (!data.user) return { ok: false, message: "Could not create the account. Try again." };
  if (!data.session) return { ok: true, needsConfirmation: true, role: input.role };

  const profile = await ensureProfile(data.user);
  return { ok: true, role: profile.role };
}
