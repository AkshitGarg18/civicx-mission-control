import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Hexagon } from "lucide-react";
import { networkStatus, roleById, roles, type RoleDefinition } from "@/lib/civicx-roles";
import { supabase } from "@/integrations/supabase/client";
import { Counter } from "./Counter";
import { RoleCard } from "./RoleCard";

/** Full-screen platform access experience: pick a mission role, then enter. */
export function RoleSelect() {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RoleDefinition | null>(null);

  useEffect(() => {
    if (!selected) return;
    let alive = true;

    const run = async () => {
      // Signed-in operators go straight to their own console; everyone else is
      // sent to sign-in with the chosen role preserved.
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!alive) return;

      if (!user) {
        void navigate({
          to: "/login",
          search: { role: selected.id, redirect: selected.to },
        });
        return;
      }

      const profile = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;

      const role = (profile.data?.role ?? selected.id) as RoleDefinition["id"];
      void navigate({ to: roleById[role]?.to ?? selected.to });
    };

    const t = setTimeout(() => void run(), reduced ? 120 : 900);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [selected, navigate, reduced]);


  return (
    <div className="relative flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:py-12">
      {/* deeper dark wash over the ambient background */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      <motion.div
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center">
            <Hexagon className="h-full w-full text-cyan/70" strokeWidth={1.2} />
            <span className="absolute h-2 w-2 rounded-full bg-cyan shadow-[0_0_12px_var(--neon-cyan)]" />
          </span>
          <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground">
            CIVICX <span className="text-cyan">//</span> PLATFORM ACCESS
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          EXIT
        </Link>
      </motion.div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center py-12">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Choose Your <span className="text-gradient">Mission Role.</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Every societal challenge requires a different force. Select how you want to
            contribute.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:gap-6 lg:grid-cols-2">
          {roles.map((role, i) => (
            <RoleCard
              key={role.id}
              role={role}
              index={i}
              selected={selected?.id ?? null}
              onSelect={setSelected}
            />
          ))}
        </div>

        <motion.p
          className="mt-8 text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Not sure where you belong?{" "}
          <Link
            to="/"
            hash="how-it-works"
            className="text-cyan underline-offset-4 transition-colors hover:underline"
          >
            → See how CivicX works
          </Link>
        </motion.p>
      </div>

      {/* live system status */}
      <motion.div
        className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 border-t border-border pt-6 sm:flex-row sm:justify-between"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-signal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          CIVICX NETWORK ONLINE
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {networkStatus.map((s) => (
            <span
              key={s.label}
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground"
            >
              <Counter value={s.value} className="text-foreground" /> {s.label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* selection transition overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <div className="relative text-center">
              <span
                className="mx-auto block h-12 w-12 rounded-2xl border"
                style={{
                  borderColor: `color-mix(in oklab, ${selected.accent} 60%, transparent)`,
                  boxShadow: `0 0 40px -8px ${selected.accent}`,
                  animation: reduced ? undefined : "radar-spin 2.4s linear infinite",
                }}
              />
              <p className="mt-6 font-mono text-[11px] tracking-[0.28em] text-muted-foreground">
                ACCESSING CIVICX COMMAND NETWORK
              </p>
              <p
                className="mt-2 font-mono text-sm tracking-[0.24em]"
                style={{ color: selected.accent }}
              >
                {selected.title} CONSOLE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
