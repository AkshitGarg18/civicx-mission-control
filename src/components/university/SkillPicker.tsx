import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { isSameSkillLabel, skillCatalog } from "@/lib/skill-catalog";

/**
 * Searchable multi-select skill tag picker. Selected values are plain skill
 * labels, stored straight into `profiles.skills`; custom entries behave
 * identically to predefined ones.
 */
export function SkillPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const has = (skill: string) => value.some((v) => isSameSkillLabel(v, skill));

  const add = (skill: string) => {
    const label = skill.trim();
    if (!label || has(label)) return;
    onChange([...value, label]);
    setQuery("");
  };

  const remove = (skill: string) => {
    onChange(value.filter((v) => !isSameSkillLabel(v, skill)));
  };

  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      skillCatalog
        .map((c) => ({
          ...c,
          skills: q ? c.skills.filter((s) => s.toLowerCase().includes(q)) : c.skills,
        }))
        .filter((c) => c.skills.length > 0),
    [q],
  );

  const exactExists =
    q.length > 0 &&
    (has(query) || skillCatalog.some((c) => c.skills.some((s) => isSameSkillLabel(s, query))));

  return (
    <div>
      {/* Selected skills */}
      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <p className="font-mono text-[10px] tracking-[0.14em] text-violet">
            NO SKILLS SELECTED YET
          </p>
        ) : (
          value.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => remove(skill)}
              aria-label={`Remove ${skill}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan transition-colors hover:border-destructive/60 hover:text-destructive"
            >
              {skill}
              <X className="h-3 w-3" />
            </button>
          ))
        )}
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3.5 py-2.5 focus-within:border-cyan/60">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              add(query);
            }
          }}
          placeholder="Search skills, or type your own…"
          maxLength={60}
          aria-label="Search skills"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {q.length > 0 && !exactExists && (
        <button
          type="button"
          onClick={() => add(query)}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet/40 bg-violet/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-violet"
        >
          <Plus className="h-3.5 w-3.5" /> ADD CUSTOM SKILL · {query.trim().toUpperCase()}
        </button>
      )}

      {/* Catalogue */}
      <div className="mt-5 space-y-5">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="mono-label text-muted-foreground">{group.label}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {group.skills.map((skill) => {
                const active = has(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => (active ? remove(skill) : add(skill))}
                    aria-pressed={active}
                    className={
                      active
                        ? "inline-flex items-center gap-1.5 rounded-lg border border-cyan/50 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                        : "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground transition-colors hover:border-cyan/40 hover:text-foreground"
                    }
                  >
                    {active && <Check className="h-3 w-3" />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No predefined skill matches “{query.trim()}” — add it as a custom skill.
          </p>
        )}
      </div>
    </div>
  );
}
