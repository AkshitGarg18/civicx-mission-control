import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Building2, CheckCircle2, Loader2, Radio } from "lucide-react";
import { collaborationStatusMeta, type CollaborationStatus } from "@/lib/industry-data";
import {
  getIndustrySignals,
  setCollaborationStatus,
  subscribeToIndustrySignals,
  type IndustrySignal,
} from "@/lib/industry-service";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Industry interest raised against one university team's solution. Read-only
 * except for closing out a collaboration, which only the team may do.
 */
export function IndustrySignals({ teamId }: { teamId: string }) {
  const [signals, setSignals] = useState<IndustrySignal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSignals(await getIndustrySignals(teamId));
    } catch (err) {
      console.error("[civicx] industry signals load failed", err);
    } finally {
      setLoaded(true);
    }
  }, [teamId]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToIndustrySignals(() => void load());
    return unsubscribe;
  }, [load]);

  const complete = async (id: string) => {
    setBusyId(id);
    try {
      await setCollaborationStatus(id, "COMPLETED");
      await load();
    } catch (err) {
      console.error("[civicx] completing collaboration failed", err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="glass-soft relative mt-4 rounded-xl border border-border p-4">
      <p className="mono-label inline-flex items-center gap-2 text-warn/90">
        <Radio className="h-3.5 w-3.5" />
        INDUSTRY SIGNALS
      </p>

      {!loaded && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
          LISTENING FOR INDUSTRY SIGNALS…
        </p>
      )}

      {loaded && signals.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No industry organisation has engaged this solution yet. Signals appear here in real
          time once your proposal has passed its AI feasibility review.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {signals.map((s) => {
          const meta =
            collaborationStatusMeta[s.collaboration.status as CollaborationStatus];
          return (
            <motion.article
              key={s.collaboration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass rounded-xl p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-3.5 w-3.5 text-warn" />
                  {s.organization?.institution ??
                    s.organization?.name ??
                    "Industry organisation"}
                </p>
                <span
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${meta.tone}`}
                >
                  {meta.label}
                </span>
              </div>

              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
                {[s.organization?.organization_type, s.organization?.industry_domain]
                  .filter(Boolean)
                  .join(" · ") || "Organisation details not shared"}
                {" · "}
                {formatDate(s.collaboration.created_at).toUpperCase()}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(s.collaboration.support_types ?? []).map((t) => (
                  <span
                    key={t}
                    className="rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-warn"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {s.collaboration.message && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                  {s.collaboration.message}
                </p>
              )}

              {s.collaboration.next_step && (
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-cyan">
                  PROPOSED NEXT STEP · {s.collaboration.next_step.toUpperCase()}
                </p>
              )}

              {s.collaboration.status === "ACTIVE" && (
                <button
                  type="button"
                  disabled={busyId === s.collaboration.id}
                  onClick={() => void complete(s.collaboration.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-signal/40 bg-signal/10 px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-signal transition-colors hover:border-signal/70 disabled:opacity-60"
                >
                  {busyId === s.collaboration.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  MARK COLLABORATION COMPLETE
                </button>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
