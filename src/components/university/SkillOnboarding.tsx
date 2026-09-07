import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateMyProfile } from "@/lib/profile-service";
import { SkillPicker } from "./SkillPicker";

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
  const id = `onboard-${label.toLowerCase().replace(/\W+/g, "-")}`;
  const shared =
    "mt-2 w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-cyan/60";
  return (
    <div>
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

/**
 * First-run skill profile setup for university operators. Writes to the same
 * `profiles` row the matching system reads — no separate student table.
 */
export function SkillOnboarding({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip: () => void;
}) {
  const reduced = useReducedMotion();
  const { currentProfile, currentUser, refreshProfile } = useAuth();

  const [name, setName] = useState(currentProfile?.name ?? "");
  const [institution, setInstitution] = useState(currentProfile?.institution ?? "");
  const [course, setCourse] = useState(currentProfile?.course ?? "");
  const [year, setYear] = useState(currentProfile?.year ?? "");
  const [bio, setBio] = useState(currentProfile?.bio ?? "");
  const [skills, setSkills] = useState<string[]>(currentProfile?.skills ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!currentUser) return;
    if (skills.length === 0) {
      setError("Select at least one skill so CivicX can match you to missions.");
      return;
    }
    setSaving(true);
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
      await refreshProfile();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-10 sm:px-6 lg:py-16">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="glass grid-floor mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] p-6 sm:p-9"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan/40 bg-cyan/10 text-cyan">
          <Sparkles className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <p className="mono-label mt-6 text-cyan">UNIVERSITY PROFILE SETUP</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Complete Your Skill Profile
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          CivicX matches you to civic missions using the skills you declare here. Nothing
          is assumed on your behalf.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="FULL NAME" value={name} onChange={setName} placeholder="Your name" />
          <Field
            label="UNIVERSITY / ORGANISATION"
            value={institution}
            onChange={setInstitution}
            placeholder="e.g. Bhagwan Parshuram Institute of Technology"
          />
          <Field label="COURSE" value={course} onChange={setCourse} placeholder="e.g. B.Tech CSE" />
          <Field label="ACADEMIC YEAR" value={year} onChange={setYear} placeholder="e.g. 2nd Year" />
        </div>

        <div className="mt-5">
          <Field
            label="SHORT BIO"
            value={bio}
            onChange={setBio}
            multiline
            placeholder="What kind of civic problems do you want to work on?"
          />
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="mono-label text-muted-foreground">YOUR SKILLS</p>
          <div className="mt-3">
            <SkillPicker value={skills} onChange={setSkills} />
          </div>
        </div>

        {error && <p className="mt-5 text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <motion.button
            type="button"
            onClick={save}
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-background disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          >
            {saving ? "SAVING…" : "SAVE PROFILE & ENTER MISSION CONTROL"}
          </motion.button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-border px-5 py-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            SKIP FOR NOW
          </button>
        </div>
        <p className="mono-label mt-5 text-muted-foreground">
          IF YOU SKIP, YOUR PROFILE STAYS MARKED “SKILL PROFILE INCOMPLETE” AND MATCHING
          REMAINS UNAVAILABLE
        </p>
      </motion.div>
    </div>
  );
}
