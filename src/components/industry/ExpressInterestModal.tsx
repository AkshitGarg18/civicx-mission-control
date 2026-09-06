import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Handshake, Loader2, X } from "lucide-react";
import { nextStepOptions, supportTypes } from "@/lib/industry-data";
import { expressInterest, type Opportunity } from "@/lib/industry-service";
import { cn } from "@/lib/utils";

/** Commit real support to a reviewed solution. Writes one collaboration record. */
export function ExpressInterestModal({
  opportunity,
  open,
  onClose,
  onDone,
}: {
  opportunity: Opportunity | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setMessage("");
      setNextStep(null);
      setError(null);
      setBusy(false);
    }
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = (type: string) =>
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );

  const submit = async () => {
    if (!opportunity || !opportunity.team) return;
    if (selected.length === 0) {
      setError("Choose at least one kind of support you can provide.");
      return;
    }
    if (message.trim().length < 20) {
      setError("Add a short note for the team — at least 20 characters.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await expressInterest({
        proposalId: opportunity.proposal.id,
        challengeId: opportunity.proposal.mission_id,
        teamId: opportunity.proposal.team_id,
        supportTypes: selected,
        message: message.trim(),
        nextStep,
      });
      onDone();
      onClose();
    } catch (err) {
      console.error("[civicx] express interest failed", err);
      setError(
        err instanceof Error ? err.message : "We could not record your interest.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && opportunity && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-5 sm:rounded-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono-label text-warn/90">EXPRESS INTEREST</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                  {opportunity.mission?.title ?? "Reviewed solution"}
                </h2>
                <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  TEAM · {opportunity.team?.team_name ?? "Unavailable"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="mono-label text-muted-foreground">SUPPORT YOU CAN PROVIDE</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {supportTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(t)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors",
                        selected.includes(t)
                          ? "border-warn/50 bg-warn/10 text-warn"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mono-label text-muted-foreground">MESSAGE TO THE TEAM</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Tell the team what you can bring: engineering support, hardware, funding, pilot sites, and what you would need from them."
                  className="mt-3 w-full rounded-xl border border-border bg-background/40 px-3.5 py-3 text-sm outline-none transition-colors focus:border-warn/50 placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <p className="mono-label text-muted-foreground">PROPOSED NEXT STEP</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextStepOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNextStep(nextStep === s ? null : s)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] transition-colors",
                        nextStep === s
                          ? "border-cyan/50 bg-cyan/10 text-cyan"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-warn/50 bg-warn/10 px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-warn transition-colors hover:border-warn/80 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Handshake className="h-4 w-4" />
                )}
                {busy ? "SENDING SIGNAL…" : "SEND INDUSTRY SIGNAL"}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                The university team sees your organisation, the support you offered and
                your message.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
