import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, X } from "lucide-react";
import { governmentNav } from "@/lib/government-data";
import { UserMenu } from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";

function NavList({
  active,
  onNavigate,
  signals,
}: {
  active: string;
  onNavigate: (id: string) => void;
  signals: number;
}) {
  const reduced = useReducedMotion();

  return (
    <nav className="flex flex-col gap-1">
      <p className="mono-label px-3 pb-2 text-muted-foreground">CIVIC OPERATIONS</p>
      {governmentNav.map((item, i) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="government-nav-active"
                className="absolute inset-0 rounded-xl border border-violet/40 bg-violet/10"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <Icon
              className={cn(
                "relative h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-violet" : "text-muted-foreground group-hover:text-violet",
              )}
            />
            <span className="relative flex-1 font-medium">{item.label}</span>
            {item.id === "missions" && signals > 0 && (
              <span className="relative rounded-md border border-violet/40 bg-violet/10 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-violet">
                {signals}
              </span>
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: ((id: string) => void) | undefined }) {
  return (
    <div className="space-y-4">
      <div className="glass-soft rounded-xl px-3 py-3">
        <p className="mono-label text-muted-foreground">OVERSIGHT LINK</p>
        <p className="mt-2 flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-signal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          LIVE
        </p>
      </div>

      <p className="inline-flex rounded-lg border border-violet/40 bg-violet/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-violet">
        GOVERNMENT
      </p>

      <UserMenu onNavigateSection={onNavigate} />

      <Link
        to="/access"
        className="flex items-center gap-2 px-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        SWITCH ROLE
      </Link>
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-lg font-mono text-xs font-semibold text-background"
        style={{ backgroundImage: "var(--gradient-accent)" }}
      >
        CX
      </span>
      <span className="text-base font-semibold tracking-tight">
        Civic<span className="text-cyan">X</span>
      </span>
    </Link>
  );
}

/** Persistent government console navigation with a mobile drawer. */
export function GovernmentSidebar({
  active,
  onNavigate,
  signals = 0,
}: {
  active: string;
  onNavigate: (id: string) => void;
  signals?: number;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <>
      <motion.aside
        initial={reduced ? false : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between overflow-y-auto rounded-none border-y-0 border-l-0 px-4 py-6 lg:flex"
      >
        <div className="space-y-8">
          <Logo />
          <NavList active={active} onNavigate={onNavigate} signals={signals} />
        </div>
        <SidebarFooter onNavigate={onNavigate} />
      </motion.aside>

      <div className="glass sticky top-0 z-40 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-background/70 backdrop-blur-sm"
            />
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: -280 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -280 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass absolute inset-y-0 left-0 flex w-[17rem] flex-col justify-between overflow-y-auto rounded-none border-y-0 border-l-0 px-4 py-6"
            >
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Logo />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close navigation"
                    className="rounded-lg border border-border p-1.5 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <NavList active={active} onNavigate={go} signals={signals} />
              </div>
              <SidebarFooter onNavigate={go} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
