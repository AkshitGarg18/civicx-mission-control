import { motion, useReducedMotion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/civicx/BrandLogo";

/**
 * Shared frame for the /login and /signup screens: CivicX chrome, a subtle
 * scanning sweep and the glass console panel that holds the form.
 */
export function AuthShell({
  label,
  heading,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  label: string;
  heading: ReactNode;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode | undefined;
  wide?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:py-10">
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-background"
        initial={false}
        animate={{ opacity: 0.6 }}
      />

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
        <Link to="/" aria-label="CivicX home" className="flex min-w-0 items-center gap-3">
          <BrandLogo eager className="h-9 w-auto shrink-0 object-left sm:h-11" />
          <span className="font-mono text-[11px] tracking-[0.28em] text-muted-foreground">
            <span className="text-cyan">//</span> {label}
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          EXIT
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center py-10">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className={
            "glass grid-floor relative w-full overflow-hidden rounded-[1.75rem] p-6 sm:p-9 " +
            (wide ? "max-w-2xl" : "max-w-md")
          }
        >
          <span
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ backgroundImage: "var(--gradient-accent)" }}
            animate={reduced ? {} : { opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {!reduced && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-24 opacity-[0.07]"
              style={{ backgroundImage: "var(--gradient-accent)" }}
              initial={{ top: "-6rem" }}
              animate={{ top: ["-6rem", "110%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="relative">
            <BrandLogo eager className="mx-auto mb-7 h-auto w-48 max-w-[72%] sm:w-56" />
            <h1 className="font-mono text-lg tracking-[0.22em] text-foreground sm:text-xl">
              {heading}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>

            <div className="mt-7">{children}</div>

            {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
          </div>
        </motion.div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl justify-center border-t border-border pt-6">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-signal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          CIVICX NETWORK ONLINE
        </span>
      </div>
    </div>
  );
}

/** Glowing-focus field used by both auth forms. */
export function AuthField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  optional = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="mono-label text-muted-foreground">
        {label}
        {optional ? <span className="text-muted-foreground/60"> (OPTIONAL)</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-xl border border-border bg-background/40 px-3.5 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-cyan/60 focus:shadow-[0_0_0_1px_color-mix(in_oklab,var(--neon-cyan)_45%,transparent),0_0_24px_-6px_var(--neon-cyan)]"
      />
    </label>
  );
}

/** Mission-control status line under the form. */
export function AuthStatus({
  state,
  message,
}: {
  state: "idle" | "working" | "granted" | "denied";
  message?: string | undefined;
}) {
  if (state === "idle" && !message) return null;

  const text =
    state === "working"
      ? "AUTHENTICATING..."
      : state === "granted"
        ? "ACCESS GRANTED"
        : state === "denied"
          ? "ACCESS DENIED"
          : "";

  const color =
    state === "granted"
      ? "text-signal"
      : state === "denied"
        ? "text-destructive"
        : "text-cyan";

  return (
    <div className="mt-5" role="status" aria-live="polite">
      {text ? (
        <p className={`font-mono text-[11px] tracking-[0.24em] ${color}`}>{text}</p>
      ) : null}
      {message ? (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
