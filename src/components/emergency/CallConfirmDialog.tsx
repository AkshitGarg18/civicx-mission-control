import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PhoneCall, X } from "lucide-react";
import { telHref } from "@/lib/emergency-data";

/**
 * Confirmation step before any call. CivicX never dials: pressing "Call now"
 * hands a tel: link to the device, which decides what happens next.
 */
export function CallConfirmDialog({
  open,
  serviceName,
  number,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  serviceName: string;
  number: string;
  onCancel: () => void;
  onConfirm?: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center px-4">
          <motion.button
            type="button"
            aria-label="Cancel call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 h-full w-full cursor-default bg-background/85 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-label="Confirm emergency call"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="glass relative w-[min(28rem,100%)] rounded-[1.5rem] border-destructive/40 p-6"
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <span className="grid h-11 w-11 place-items-center rounded-xl border border-destructive/45 bg-destructive/10">
              <PhoneCall className="h-5 w-5 text-destructive" />
            </span>

            <p className="mt-4 text-base font-semibold">
              You&apos;re about to contact emergency services.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {serviceName} · <span className="font-mono text-foreground">{number}</span>. Your
              device will place this call — CivicX cannot call on your behalf and no authority has
              been contacted yet.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <a
                href={telHref(number)}
                onClick={onConfirm}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/50 bg-destructive/15 px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/25"
              >
                <PhoneCall className="h-4 w-4" />
                CALL NOW
              </a>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-5 py-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
