import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Loader2, Save } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { organizationTypes, supportTypes } from "@/lib/industry-data";
import {
  parseList,
  saveOrganizationProfile,
  type ProfileRow,
} from "@/lib/industry-service";
import { cn } from "@/lib/utils";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mono-label text-muted-foreground">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background/40 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-warn/50 placeholder:text-muted-foreground";

/** The organisation record that drives capability matching across the console. */
export function OrganizationProfilePanel({
  profile,
  loaded,
  onSaved,
}: {
  profile: ProfileRow | null;
  loaded: boolean;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [orgType, setOrgType] = useState<string | null>(null);
  const [domain, setDomain] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [tech, setTech] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setInstitution(profile.institution ?? "");
    setOrgType(profile.organization_type ?? null);
    setDomain(profile.industry_domain ?? "");
    setWebsite(profile.website ?? "");
    setBio(profile.bio ?? "");
    setExpertise((profile.expertise_areas ?? []).join(", "));
    setTech((profile.technologies ?? []).join(", "));
    setCapabilities(profile.support_capabilities ?? []);
  }, [profile]);

  const toggleCapability = (c: string) =>
    setCapabilities((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const save = async () => {
    if (!institution.trim()) {
      setError("Add your organisation name.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveOrganizationProfile({
        name: name.trim(),
        institution: institution.trim(),
        organizationType: orgType,
        industryDomain: domain.trim() || null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        expertiseAreas: parseList(expertise),
        technologies: parseList(tech),
        supportCapabilities: capabilities,
      });
      setMessage("Organisation profile saved.");
      onSaved();
    } catch (err) {
      console.error("[civicx] organisation profile save failed", err);
      setError("We could not save your organisation profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <Reveal>
        <SectionLabel>ORGANIZATION PROFILE</SectionLabel>
        <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          Tell CivicX what your organisation can do
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Your expertise and technologies power capability matching on every opportunity,
          and university teams see your organisation name when you reach out.
        </p>
      </Reveal>

      {!loaded ? (
        <p className="mono-label text-muted-foreground">LOADING PROFILE…</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="glass space-y-5 rounded-2xl p-5 sm:p-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="ORGANISATION NAME">
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Nova Water Systems"
                className={inputClass}
              />
            </Field>
            <Field label="CONTACT NAME">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Who university teams will be talking to"
                className={inputClass}
              />
            </Field>
            <Field label="SECTOR / DOMAIN">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Water infrastructure, clean energy"
                className={inputClass}
              />
            </Field>
            <Field label="WEBSITE">
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="ORGANISATION TYPE">
            <div className="flex flex-wrap gap-2">
              {organizationTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrgType(orgType === t ? null : t)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors",
                    orgType === t
                      ? "border-warn/50 bg-warn/10 text-warn"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="EXPERTISE AREAS"
            hint="Comma separated. Used to match you with solutions."
          >
            <input
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="Water treatment, IoT sensing, logistics"
              className={inputClass}
            />
          </Field>

          <Field label="TECHNOLOGIES" hint="Comma separated.">
            <input
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="LoRaWAN, computer vision, solar microgrids"
              className={inputClass}
            />
          </Field>

          <Field label="SUPPORT YOU CAN OFFER">
            <div className="flex flex-wrap gap-2">
              {supportTypes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleCapability(s)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors",
                    capabilities.includes(s)
                      ? "border-cyan/50 bg-cyan/10 text-cyan"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>

          <Field label="ABOUT YOUR ORGANISATION">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="What you build, where you operate, and the kind of civic work you want to back."
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-signal">{message}</p>}

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-warn transition-colors hover:border-warn/80 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {busy ? "SAVING…" : "SAVE PROFILE"}
          </button>
        </motion.div>
      )}
    </section>
  );
}
