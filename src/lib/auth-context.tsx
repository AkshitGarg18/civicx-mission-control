import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { RoleId } from "@/lib/civicx-roles";

/**
 * Single source of truth for the CivicX session. Every screen reads the
 * signed-in user, their profile and their role from here — no page performs
 * its own auth lookup.
 */

export interface CivicProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: RoleId;
  institution: string | null;
  skills: string[] | null;
}

interface AuthValue {
  currentUser: User | null;
  currentProfile: CivicProfile | null;
  role: RoleId | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const validRoles: RoleId[] = ["citizen", "university", "industry", "government"];

function normaliseRole(value: unknown): RoleId {
  return validRoles.includes(value as RoleId) ? (value as RoleId) : "citizen";
}

function metadataProfile(user: User): CivicProfile {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    name: typeof meta["name"] === "string" ? (meta["name"] as string) : null,
    email: user.email ?? null,
    role: normaliseRole(meta["role"]),
    institution:
      typeof meta["institution"] === "string" ? (meta["institution"] as string) : null,
    skills: null,
  };
}

/**
 * Reads the profile row for a user, creating it from the signup metadata when
 * it does not exist yet. Uses the user's own id so RLS stays intact, and
 * upserts so refreshing or signing in again never creates a duplicate.
 */
export async function ensureProfile(user: User): Promise<CivicProfile> {
  const fallback = metadataProfile(user);

  const existing = await supabase
    .from("profiles")
    .select("id, name, email, role, institution, skills")
    .eq("id", user.id)
    .maybeSingle();

  if (existing.data) {
    return {
      id: existing.data.id,
      name: existing.data.name,
      email: existing.data.email,
      role: normaliseRole(existing.data.role),
      institution: existing.data.institution,
      skills: existing.data.skills,
    };
  }

  const inserted = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        name: fallback.name,
        email: fallback.email,
        role: fallback.role,
        institution: fallback.institution,
      },
      { onConflict: "id" },
    )
    .select("id, name, email, role, institution, skills")
    .maybeSingle();

  if (inserted.data) {
    return {
      id: inserted.data.id,
      name: inserted.data.name,
      email: inserted.data.email,
      role: normaliseRole(inserted.data.role),
      institution: inserted.data.institution,
      skills: inserted.data.skills,
    };
  }

  // Profile write failed (offline, policy, race) — keep the app usable.
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<CivicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session: Session | null) => {
    const user = session?.user ?? null;
    setCurrentUser(user);
    if (!user) {
      setCurrentProfile(null);
      return;
    }
    try {
      setCurrentProfile(await ensureProfile(user));
    } catch {
      setCurrentProfile(metadataProfile(user));
    }
  }, []);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      await applySession(data.session);
      if (alive) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void applySession(session).then(() => {
        if (alive) setLoading(false);
      });
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;
    setCurrentProfile(await ensureProfile(currentUser));
  }, [currentUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentProfile(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      currentUser,
      currentProfile,
      role: currentProfile?.role ?? null,
      loading,
      signOut,
      refreshProfile,
    }),
    [currentUser, currentProfile, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
