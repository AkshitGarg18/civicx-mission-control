import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { roleById, type RoleId } from "@/lib/civicx-roles";

/**
 * Placeholder console frame for a role dashboard. Each role's real dashboard
 * will be built inside this shell later.
 */
export function DashboardShell({
  roleId,
  children,
}: {
  roleId: RoleId;
  children?: React.ReactNode;
}) {
  const role = roleById[roleId];
  const Icon = role.icon;

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground">
          CIVICX <span style={{ color: role.accent }}>//</span> {role.title} CONSOLE
        </span>
        <Link
          to="/access"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          SWITCH ROLE
        </Link>
      </div>

      <motion.div
        className="glass relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12"
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1 }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, ${role.accent} 22%, transparent), transparent 65%)`,
          }}
        />
        <span className="pointer-events-none absolute inset-0 grid-floor opacity-30" />

        <div className="relative">
          <span
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border"
            style={{
              borderColor: `color-mix(in oklab, ${role.accent} 45%, transparent)`,
              backgroundColor: `color-mix(in oklab, ${role.accent} 12%, transparent)`,
              color: role.accent,
            }}
          >
            <Icon className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h1
            className="mt-6 font-mono text-xl tracking-[0.26em]"
            style={{ color: role.accent }}
          >
            {role.title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{role.caption}</p>
          <p className="mono-label mt-6">CONSOLE INITIALISING — COMING SOON</p>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
