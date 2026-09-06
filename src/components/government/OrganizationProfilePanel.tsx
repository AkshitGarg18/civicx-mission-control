import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import {
  getGovernmentProfile,
  parseList,
  saveGovernmentProfile,
  type ProfileRow,
} from "@/lib/government-service";

const field =
  "w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-violet/50";

/** Government organisation profile, stored on the operator's own profile row. */
export function OrganizationProfilePanel() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [bio, setBio] = useState("");
  const [areas, setAreas] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const row = await getGovernmentProfile();
        if (!alive) return;
        setProfile(row);
        setName(row?.name ?? "");
        setInstitution(row?.institution ?? "");
        setDepartment(row?.department ?? "");
        setJurisdiction(row?.jurisdiction ?? "");
        setBio(row?.bio ?? "");
        setAreas((row?.expertise_areas ?? []).join(", "));
      } catch {
        if (alive) setError("We could not load your organisation profile.");
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const row = await saveGovernmentProfile({
        name: name.trim(),
        institution: institution.trim(),
        department: department.trim() || null,
        jurisdiction: jurisdiction.trim() || null,
        bio: bio.trim() || null,
        expertiseAreas: parseList(areas),
      });
      setProfile(row);
      setSaved(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      );
    } catch {
      setError("We could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="mono-label text-muted-foreground">OPERATOR IDENTITY</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          ORGANIZATION PROFILE
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your government body, department and area of responsibility.
        </p>
      </div>

      {!loaded ? (
        <p className="glass rounded-2xl p-6 font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
          LOADING PROFILE…
        </p>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={submit}
          className="glass space-y-4 rounded-2xl p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="mono-label text-muted-foreground">OPERATOR NAME</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </label>
            <label className="space-y-1.5">
              <span className="mono-label text-muted-foreground">GOVERNMENT BODY</span>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Pune Municipal Corporation"
                className={field}
              />
            </label>
            <label className="space-y-1.5">
              <span className="mono-label text-muted-foreground">DEPARTMENT</span>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Urban Water Supply"
                className={field}
              />
            </label>
            <label className="space-y-1.5">
              <span className="mono-label text-muted-foreground">JURISDICTION</span>
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. Pune district"
                className={field}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="mono-label text-muted-foreground">AREAS OF RESPONSIBILITY</span>
            <input
              value={areas}
              onChange={(e) => setAreas(e.target.value)}
              placeholder="Water, Sanitation, Roads"
              className={field}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="mono-label text-muted-foreground">ABOUT</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="What your office oversees and how it engages with civic solutions."
              className={`${field} resize-y`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-violet/40 bg-violet/10 px-4 py-2.5 font-mono text-[10px] tracking-[0.18em] text-violet transition-colors hover:bg-violet/20 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              SAVE PROFILE
            </button>
            {saved && (
              <span className="font-mono text-[10px] tracking-[0.16em] text-signal">
                PROFILE SAVED · {saved}
              </span>
            )}
            {profile?.email && (
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                {profile.email}
              </span>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </motion.form>
      )}
    </section>
  );
}
