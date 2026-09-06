import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Plus, Save, Send, Trash2, X } from "lucide-react";
import type { ChallengeRow } from "@/lib/challenges-service";
import { teamCoverage, type TeamWithMembers } from "@/lib/teams-service";
import {
  createDraft,
  draftFromRow,
  emptyDraft,
  saveDraft,
  submitProposal,
  validateDraft,
  type ProposalDraft,
  type ProposalRow,
} from "@/lib/proposals-service";

/** Compact tag editor used for technologies and resources. */
function TagField({
  label,
  hint,
  values,
  suggestions,
  onChange,
}: {
  label: string;
  hint: string;
  values: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [entry, setEntry] = useState("");

  const add = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
    setEntry("");
  };

  const open = suggestions.filter(
    (s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="glass-soft rounded-xl p-4">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>

      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
            >
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(entry);
            }
          }}
          placeholder="Type and press Enter"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-cyan/60"
        />
        <button
          type="button"
          onClick={() => add(entry)}
          className="rounded-lg border border-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ADD
        </button>
      </div>

      {open.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {open.slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground transition-colors hover:border-cyan/50 hover:text-cyan"
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LongField({
  label,
  placeholder,
  value,
  rows,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  rows: number;
  onChange: (next: string) => void;
}) {
  return (
    <div className="glass-soft rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="mono-label text-muted-foreground">{label}</p>
        <span className="font-mono text-[10px] text-muted-foreground">
          {value.trim().length} CHARS
        </span>
      </div>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full resize-y rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan/60"
      />
    </div>
  );
}

/**
 * Solution design workspace: draft editing, draft saving, the read-only review
 * screen and final submission. Nothing here is stored locally — every save goes
 * to the team's own proposal record.
 */
export function ProposalWorkspace({
  entry,
  mission,
  proposal,
  userId,
  isLeader,
  onBack,
  onSaved,
  onSubmitted,
}: {
  entry: TeamWithMembers;
  mission: ChallengeRow | null;
  proposal: ProposalRow | null;
  userId: string;
  isLeader: boolean;
  onBack: () => void;
  onSaved: (row: ProposalRow) => void;
  onSubmitted: (row: ProposalRow) => void;
}) {
  const [draft, setDraft] = useState<ProposalDraft>(
    proposal ? draftFromRow(proposal) : emptyDraft(),
  );
  const [row, setRow] = useState<ProposalRow | null>(proposal);
  const [phase, setPhase] = useState<"form" | "review">("form");
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const recommended = mission?.recommended_skills ?? null;
  const coverage = teamCoverage(
    entry.members.map((m) => ({ skills: m.profile?.skills ?? [] })),
    recommended,
  );
  const percent = coverage.percent ?? entry.team.skill_coverage;
  const teamSkills = [...new Set(entry.members.flatMap((m) => m.profile?.skills ?? []))];
  const errors = validateDraft(draft);

  const patch = (next: Partial<ProposalDraft>) => setDraft((d) => ({ ...d, ...next }));

  const persist = async (): Promise<ProposalRow> => {
    if (row) return await saveDraft(row.id, draft);
    if (!mission) throw new Error("This mission is no longer available.");
    return await createDraft({
      missionId: mission.id,
      teamId: entry.team.id,
      userId,
      draft,
    });
  };

  const handleSave = async () => {
    setBusy("save");
    setError(null);
    try {
      const saved = await persist();
      setRow(saved);
      setSavedAt(new Date().toLocaleTimeString());
      onSaved(saved);
    } catch (err) {
      console.error("[civicx] saving proposal draft failed", err);
      setError("The draft could not be saved. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleSubmit = async () => {
    setBusy("submit");
    setError(null);
    try {
      const saved = await persist();
      setRow(saved);
      const submitted = await submitProposal(saved.id);
      onSubmitted(submitted);
    } catch (err) {
      console.error("[civicx] submitting proposal failed", err);
      setError(
        isLeader
          ? "The proposal could not be submitted. Please try again."
          : "Only the team leader can submit this proposal.",
      );
    } finally {
      setBusy(null);
    }
  };

  const phases = draft.implementationPlan;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        BACK TO TEAM
      </button>

      <div className="glass grid-floor relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/20 opacity-40 blur-3xl" />
        <p className="mono-label text-cyan/90">
          {phase === "form" ? "SOLUTION DESIGN WORKSPACE" : "PROPOSAL REVIEW"}
        </p>
        <h2 className="relative mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {mission?.title ?? "Mission unavailable"}
        </h2>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "CATEGORY", value: mission?.category ?? "—" },
            { label: "LOCATION", value: mission?.location_name ?? "—" },
            { label: "TEAM", value: entry.team.team_name },
            {
              label: "SKILL COVERAGE",
              value: percent === null ? "—" : `${percent}%`,
            },
          ].map((s) => (
            <div key={s.label} className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">{s.label}</p>
              <p className="mt-1.5 truncate text-sm font-medium">{s.value}</p>
            </div>
          ))}
        </div>

        {recommended && recommended.length > 0 && (
          <div className="relative mt-3">
            <p className="mono-label text-muted-foreground">AI RECOMMENDED SKILLS</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recommended.map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-violet/40 bg-violet/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-violet"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {phase === "form" ? (
        <div className="space-y-3">
          <LongField
            label="PROBLEM UNDERSTANDING"
            placeholder="Explain your team's understanding of the problem and its root causes."
            rows={5}
            value={draft.problemUnderstanding}
            onChange={(v) => patch({ problemUnderstanding: v })}
          />
          <LongField
            label="PROPOSED SOLUTION"
            placeholder="Describe your proposed solution, how it works, and how it addresses the civic challenge."
            rows={8}
            value={draft.proposedSolution}
            onChange={(v) => patch({ proposedSolution: v })}
          />
          <TagField
            label="TECHNOLOGY & APPROACH"
            hint="Suggestions come from your team's skills and the mission's AI-recommended skills."
            values={draft.technologies}
            suggestions={[...new Set([...(recommended ?? []), ...teamSkills])]}
            onChange={(v) => patch({ technologies: v })}
          />
          <LongField
            label="EXPECTED IMPACT"
            placeholder="Explain who benefits, what changes, and how success will be measured."
            rows={5}
            value={draft.expectedImpact}
            onChange={(v) => patch({ expectedImpact: v })}
          />

          <div className="glass-soft rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="mono-label text-muted-foreground">IMPLEMENTATION PLAN</p>
              <button
                type="button"
                onClick={() =>
                  patch({
                    implementationPlan: [
                      ...phases,
                      { name: "", description: "", duration: "" },
                    ],
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                ADD PHASE
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {phases.map((p, i) => (
                <div key={i} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="mono-label text-cyan/90">PHASE {i + 1}</p>
                    <button
                      type="button"
                      onClick={() =>
                        patch({
                          implementationPlan: phases.filter((_, idx) => idx !== i),
                        })
                      }
                      className="text-muted-foreground transition-colors hover:text-warn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      value={p.name}
                      placeholder="Phase name"
                      onChange={(e) =>
                        patch({
                          implementationPlan: phases.map((x, idx) =>
                            idx === i ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                      className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-cyan/60"
                    />
                    <input
                      value={p.duration}
                      placeholder="Estimated duration, e.g. 2 weeks"
                      onChange={(e) =>
                        patch({
                          implementationPlan: phases.map((x, idx) =>
                            idx === i ? { ...x, duration: e.target.value } : x,
                          ),
                        })
                      }
                      className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-cyan/60"
                    />
                  </div>
                  <textarea
                    value={p.description}
                    rows={2}
                    placeholder="What happens in this phase?"
                    onChange={(e) =>
                      patch({
                        implementationPlan: phases.map((x, idx) =>
                          idx === i ? { ...x, description: e.target.value } : x,
                        ),
                      })
                    }
                    className="mt-2 w-full resize-y rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-cyan/60"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">ESTIMATED TIMELINE</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Total time your team expects to need, for example “8 weeks”.
            </p>
            <input
              value={draft.estimatedTimeline}
              placeholder="8 weeks"
              onChange={(e) => patch({ estimatedTimeline: e.target.value })}
              className="mt-3 w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-cyan/60 sm:max-w-xs"
            />
          </div>

          <TagField
            label="RESOURCES REQUIRED"
            hint="What your team needs to deliver this — hardware, data, access or mentorship."
            values={draft.resourcesRequired}
            suggestions={[
              "IoT hardware",
              "Municipal data",
              "Cloud infrastructure",
              "Field testing access",
              "Industry mentorship",
            ]}
            onChange={(v) => patch({ resourcesRequired: v })}
          />

          {errors.length > 0 && (
            <div className="glass-soft rounded-xl border border-warn/40 p-4">
              <p className="mono-label text-warn">BEFORE SUBMISSION</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {errors.map((e) => (
                  <li key={e}>· {e}</li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-warn">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-foreground transition-colors hover:border-cyan/60 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {busy === "save" ? "SAVING…" : "SAVE DRAFT"}
            </button>
            <button
              type="button"
              onClick={() => setPhase("review")}
              disabled={errors.length > 0}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan/50 bg-cyan/10 px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-cyan transition-colors hover:border-cyan disabled:opacity-40"
            >
              REVIEW PROPOSAL
            </button>
            {savedAt && (
              <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                DRAFT SAVED · {savedAt}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { label: "PROBLEM", value: draft.problemUnderstanding },
            { label: "SOLUTION", value: draft.proposedSolution },
            { label: "EXPECTED IMPACT", value: draft.expectedImpact },
          ].map((s) => (
            <div key={s.label} className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">{s.label}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{s.value}</p>
            </div>
          ))}

          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">TECHNOLOGY</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.technologies.map((t) => (
                <span
                  key={t}
                  className="rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-soft rounded-xl p-4">
            <p className="mono-label text-muted-foreground">IMPLEMENTATION PLAN</p>
            <div className="mt-3 space-y-3">
              {phases
                .filter((p) => p.name.trim() && p.description.trim())
                .map((p, i) => (
                  <div key={i} className="rounded-xl border border-border p-3.5">
                    <p className="mono-label text-cyan/90">PHASE {i + 1}</p>
                    <p className="mt-1.5 text-sm font-medium">{p.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    {p.duration && (
                      <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                        {p.duration}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">TIMELINE</p>
              <p className="mt-1.5 text-sm font-medium">{draft.estimatedTimeline}</p>
            </div>
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">RESOURCES</p>
              <p className="mt-1.5 text-sm">{draft.resourcesRequired.join(" · ")}</p>
            </div>
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">TEAM</p>
              <p className="mt-1.5 text-sm font-medium">
                {entry.team.team_name} · {entry.members.length} members
              </p>
            </div>
            <div className="glass-soft rounded-xl p-4">
              <p className="mono-label text-muted-foreground">SKILL COVERAGE</p>
              <p className="mt-1.5 text-sm font-medium text-cyan">
                {percent === null ? "—" : `${percent}%`}
              </p>
            </div>
          </div>

          <p className="mono-label text-warn">
            ONCE SUBMITTED, THIS PROPOSAL CAN NO LONGER BE EDITED BY THE TEAM.
          </p>
          {!isLeader && (
            <p className="text-xs text-muted-foreground">
              Only the team leader can submit the final proposal.
            </p>
          )}
          {error && <p className="text-sm text-warn">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPhase("form")}
              className="rounded-xl border border-border px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              CONTINUE EDITING
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy !== null || !isLeader}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan/60 bg-cyan/15 px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-cyan transition-colors hover:border-cyan disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              {busy === "submit" ? "SUBMITTING…" : "SUBMIT SOLUTION PROPOSAL"}
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
