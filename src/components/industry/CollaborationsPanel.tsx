import { useState } from "react";
import { motion } from "motion/react";
import { Handshake, Loader2, MapPin } from "lucide-react";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import {
  collaborationStatusMeta,
  industryStatusActions,
  type CollaborationStatus,
} from "@/lib/industry-data";
import {
  setCollaborationStatus,
  type CollaborationEntry,
} from "@/lib/industry-service";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/** Every collaboration this organisation has opened, with real lifecycle controls. */
export function CollaborationsPanel({
  entries,
  loaded,
  onChanged,
}: {
  entries: CollaborationEntry[];
  loaded: boolean;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const move = async (id: string, status: CollaborationStatus) => {
    setBusyId(id);
    setError(null);
    try {
      await setCollaborationStatus(id, status);
      onChanged();
    } catch (err) {
      console.error("[civicx] collaboration status change failed", err);
      setError("We could not update this collaboration.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <Reveal>
        <SectionLabel>MY COLLABORATIONS</SectionLabel>
        <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          Solutions your organisation is backing
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each record is visible to the university team behind the solution, so they always
          know where the conversation stands.
        </p>
      </Reveal>

      {!loaded && <p className="mono-label text-muted-foreground">LOADING RECORDS…</p>}

      {loaded && entries.length === 0 && (
        <div className="glass grid-floor rounded-2xl px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-warn/40 bg-warn/10 text-warn">
            <Handshake className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="mono-label mt-6 text-warn/90">NO COLLABORATIONS YET</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Open the Opportunities feed and express interest in a reviewed solution to start
            your first collaboration.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {entries.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map((entry) => {
            const status = entry.collaboration.status as CollaborationStatus;
            const meta = collaborationStatusMeta[status];
            const actions = industryStatusActions[status] ?? [];
            return (
              <motion.article
                key={entry.collaboration.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="glass flex h-full flex-col rounded-2xl p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${meta.tone}`}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                    {formatDate(entry.collaboration.created_at).toUpperCase()}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold leading-snug tracking-tight">
                  {entry.mission?.title ?? "Mission unavailable"}
                </h3>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {entry.mission?.location_name ?? "Location pending"}
                  </span>
                  <span>· {entry.team?.team_name ?? "Team unavailable"}</span>
                </p>

                <div className="glass-soft mt-4 rounded-xl p-3.5">
                  <p className="mono-label text-muted-foreground">SUPPORT OFFERED</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(entry.collaboration.support_types ?? []).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-warn"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {entry.collaboration.next_step && (
                    <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-cyan">
                      NEXT STEP · {entry.collaboration.next_step.toUpperCase()}
                    </p>
                  )}
                </div>

                {entry.collaboration.message && (
                  <div className="glass-soft mt-3 rounded-xl p-3.5">
                    <p className="mono-label text-muted-foreground">YOUR MESSAGE</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                      {entry.collaboration.message}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-muted-foreground">{meta.caption}</p>

                {actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((a) => (
                      <button
                        key={a.to}
                        type="button"
                        disabled={busyId === entry.collaboration.id}
                        onClick={() => void move(entry.collaboration.id, a.to)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:border-warn/50 hover:text-warn disabled:opacity-60"
                      >
                        {busyId === entry.collaboration.id && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
