import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Users, X } from "lucide-react";
import { inferTeamRoles } from "@/lib/university-data";

/**
 * Foundation for the team system: presents the skills the AI recommended and
 * the roles those skills imply. No team records are created yet.
 */
export function TeamFormationModal({
  open,
  skills,
  onClose,
}: {
  open: boolean;
  skills: string[] | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const [initialising, setInitialising] = useState(false);
  const roles = inferTeamRoles(skills);

  const close = () => {
    setInitialising(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] grid place-items-center p-4">
          <motion.button
            type="button"
            aria-label="Close team formation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-background/85 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-label="Mission team formation"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass grid-floor relative w-[min(34rem,100%)] overflow-hidden rounded-[1.75rem] p-6 sm:p-8"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-azure/40 bg-azure/10 text-azure">
              <Users className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <p className="mono-label mt-5 text-azure/90">MISSION TEAM FORMATION</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
              This challenge requires a multidisciplinary team.
            </h3>

            <div className="glass-soft mt-6 rounded-xl p-4">
              <p className="mono-label text-muted-foreground">RECOMMENDED SKILLS</p>
              {skills && skills.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border border-cyan/30 bg-cyan/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-cyan"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No skills recommended for this mission yet.
                </p>
              )}
            </div>

            <div className="glass-soft mt-3 rounded-xl p-4">
              <p className="mono-label text-muted-foreground">SUGGESTED TEAM ROLES</p>
              {roles.length > 0 ? (
                <ul className="mt-2.5 space-y-2">
                  {roles.map((role) => (
                    <li key={role} className="flex gap-2.5 text-sm text-foreground/85">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet/80" />
                      {role}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Roles will be suggested once this mission has recommended skills.
                </p>
              )}
            </div>

            {initialising ? (
              <p className="mono-label mt-6 flex items-center gap-2 text-signal">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
                </span>
                TEAM FORMATION MODULE INITIALIZING
              </p>
            ) : (
              <motion.button
                type="button"
                onClick={() => setInitialising(true)}
                whileHover={reduced ? {} : { y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-background motion-reduce:transform-none"
                style={{ backgroundImage: "var(--gradient-accent)" }}
              >
                START TEAM FORMATION
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
