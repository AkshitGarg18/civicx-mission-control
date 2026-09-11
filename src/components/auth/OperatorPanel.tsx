import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { roleById } from "@/lib/civicx-roles";
import { updateMyProfile } from "@/lib/profile-service";
import {
  getMyInstitution,
  parseList,
  updateMyInstitution,
} from "@/lib/institution-service";
import { SkillPicker } from "@/components/university/SkillPicker";


function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-border py-3">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const id = `field-${label.toLowerCase().replace(/\W+/g, "-")}`;
  const shared =
    "mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-cyan/60";
  return (
    <div className="border-t border-border py-4">
      <label htmlFor={id} className="mono-label text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      )}
    </div>
  );
}

/** Profile / settings console for the signed-in operator. */
export function OperatorPanel({ view }: { view: "profile" | "settings" }) {
  const reduced = useReducedMotion();
  const { currentProfile, currentUser, refreshProfile } = useAuth();
  const role = currentProfile?.role ?? "citizen";
  const home = roleById[role].to;

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [district, setDistrict] = useState("");
  const [disciplines, setDisciplines] = useState("");
  const [research, setResearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [labs, setLabs] = useState("");
  const [innovation, setInnovation] = useState("");
  const [techCaps, setTechCaps] = useState("");
  const [civicDomains, setCivicDomains] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProfile) return;
    setName(currentProfile.name ?? "");
    setInstitution(currentProfile.institution ?? "");
    setCourse(currentProfile.course ?? "");
    setYear(currentProfile.year ?? "");
    setBio(currentProfile.bio ?? "");
    setSkills(currentProfile.skills ?? []);
  }, [currentProfile]);

  /** Institution-level capabilities live on the same profile row. */
  useEffect(() => {
    if (!currentUser || role !== "university") return;
    let cancelled = false;
    void (async () => {
      const own = await getMyInstitution(currentUser.id);
      if (!own || cancelled) return;
      setDistrict(own.district ?? "");
      setDisciplines(own.academicDisciplines.join(", "));
      setResearch(own.researchAreas.join(", "));
      setFaculty(own.facultyExpertise.join(", "));
      setLabs(own.labCapabilities.join(", "));
      setInnovation(own.innovationFacilities.join(", "));
      setTechCaps(own.techCapabilities.join(", "));
      setCivicDomains(own.civicDomains.join(", "));
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser, role]);

  const save = async () => {
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateMyProfile(currentUser.id, {
        name: name.trim() || null,
        institution: institution.trim() || null,
        course: course.trim() || null,
        year: year.trim() || null,
        bio: bio.trim() || null,
        skills,
      });
      if (role === "university") {
        await updateMyInstitution(currentUser.id, {
          district: district.trim() || null,
          academicDisciplines: parseList(disciplines),
          researchAreas: parseList(research),
          facultyExpertise: parseList(faculty),
          labCapabilities: parseList(labs),
          innovationFacilities: parseList(innovation),
          techCapabilities: parseList(techCaps),
          civicDomains: parseList(civicDomains),
        });
      }
      await refreshProfile();
      setMessage("PROFILE SYNCHRONISED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const skillsMissing = (currentProfile?.skills ?? []).length === 0;

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground">
          CIVICX <span className="text-cyan">//</span>{" "}
          {view === "profile" ? "OPERATOR PROFILE" : "CONSOLE SETTINGS"}
        </span>
        <Link
          to={home}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO CONSOLE
        </Link>
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="glass grid-floor mx-auto mt-10 max-w-3xl overflow-hidden rounded-[1.75rem] p-6 sm:p-9"
      >
        <h1 className="font-mono text-lg tracking-[0.22em]">
          {view === "profile" ? "OPERATOR PROFILE" : "CONSOLE SETTINGS"}
        </h1>

        {view === "profile" ? (
          <div className="mt-6">
            {skillsMissing ? (
              <div className="rounded-xl border border-violet/30 bg-violet/5 p-4">
                <p className="mono-label text-violet">SKILL PROFILE INCOMPLETE</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your skills below so CivicX can match you to civic missions.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-signal/30 bg-signal/5 p-4">
                <p className="mono-label text-signal">SKILL PROFILE COMPLETE</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(currentProfile?.skills ?? []).map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}


            <div className="mt-4">
              <Field label="NAME" value={name} onChange={setName} />
              <Row
                label="EMAIL"
                value={currentProfile?.email ?? currentUser?.email ?? "—"}
              />
              <Row label="ROLE" value={roleById[role].title} />
              <Field
                label="ORGANISATION / UNIVERSITY"
                value={institution}
                onChange={setInstitution}
                placeholder="e.g. Bhagwan Parshuram Institute of Technology"
              />
              <Field
                label="COURSE / BRANCH"
                value={course}
                onChange={setCourse}
                placeholder="e.g. B.Tech CSE"
              />
              <Field label="YEAR" value={year} onChange={setYear} placeholder="e.g. 2nd Year" />
              <Field label="BIO" value={bio} onChange={setBio} multiline />
              <div className="border-t border-border py-4">
                <p className="mono-label text-muted-foreground">EDIT SKILL PROFILE</p>
                <div className="mt-3">
                  <SkillPicker value={skills} onChange={setSkills} />
                </div>
              </div>

              {role === "university" && (
                <>
                  <div className="border-t border-border pt-5">
                    <p className="mono-label text-azure">INSTITUTION CAPABILITY PROFILE</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Used to match your institution to civic missions. Separate entries
                      with commas. Only university accounts can see these details.
                    </p>
                  </div>
                  <Field
                    label="DISTRICT / CITY"
                    value={district}
                    onChange={setDistrict}
                    placeholder="e.g. Delhi"
                  />
                  <Field
                    label="ACADEMIC DISCIPLINES"
                    value={disciplines}
                    onChange={setDisciplines}
                    placeholder="e.g. Civil Engineering, Computer Science, Environmental Engineering"
                  />
                  <Field
                    label="RESEARCH AREAS"
                    value={research}
                    onChange={setResearch}
                    placeholder="e.g. Water management, Air quality monitoring"
                  />
                  <Field
                    label="FACULTY EXPERTISE"
                    value={faculty}
                    onChange={setFaculty}
                    placeholder="e.g. Urban infrastructure, Remote sensing"
                  />
                  <Field
                    label="LABORATORY CAPABILITIES"
                    value={labs}
                    onChange={setLabs}
                    placeholder="e.g. GIS lab, Water testing lab, IoT lab"
                  />
                  <Field
                    label="INNOVATION / INCUBATION FACILITIES"
                    value={innovation}
                    onChange={setInnovation}
                    placeholder="e.g. Startup incubation centre, Prototyping workshop"
                  />
                  <Field
                    label="TECHNOLOGY CAPABILITIES"
                    value={techCaps}
                    onChange={setTechCaps}
                    placeholder="e.g. GIS, IoT, AI/ML, Data analytics"
                  />
                  <Field
                    label="SUPPORTED CIVIC DOMAINS"
                    value={civicDomains}
                    onChange={setCivicDomains}
                    placeholder="e.g. Water Management, Waste Management, Urban Mobility"
                  />
                </>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            {message && <p className="mono-label mt-4 text-signal">{message}</p>}

            <motion.button
              type="button"
              onClick={save}
              disabled={saving}
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-accent)" }}
            >
              {saving ? "SAVING…" : "SAVE PROFILE"}
            </motion.button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <Row label="NOTIFICATIONS" value="Mission updates — coming soon" />
              <Row label="VISIBILITY" value="Public reporting profile — coming soon" />
              <Row label="LANGUAGE" value="English (default)" />
            </div>
            <p className="mono-label mt-8 text-muted-foreground">
              THIS CONSOLE IS INITIALISING — EDITING ARRIVES IN A LATER MISSION UPDATE
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
