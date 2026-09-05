import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { AuthField, AuthShell, AuthStatus } from "./AuthShell";
import { signUpWithEmail } from "@/lib/auth-service";
import { roleById, roles, type RoleId } from "@/lib/civicx-roles";
import { cn } from "@/lib/utils";

type State = "idle" | "working" | "granted" | "denied";

const orgLabel: Record<RoleId, string> = {
  citizen: "ORGANISATION",
  university: "INSTITUTION NAME",
  industry: "ORGANIZATION NAME",
  government: "DEPARTMENT / ORGANIZATION",
};

/** JOIN THE CIVICX NETWORK — account creation with role selection. */
export function SignupForm({ role: initialRole, redirect }: { role?: RoleId; redirect?: string }) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<RoleId>(initialRole ?? "citizen");
  const [institution, setInstitution] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "working" || state === "granted") return;

    if (!name.trim() || !email.trim() || !password) {
      setState("denied");
      setMessage("Fill in your name, email and password to continue.");
      return;
    }
    if (password.length < 6) {
      setState("denied");
      setMessage("Choose a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setState("denied");
      setMessage("The two passwords do not match.");
      return;
    }
    if (role !== "citizen" && !institution.trim()) {
      setState("denied");
      setMessage(`Enter your ${orgLabel[role].toLowerCase()} to continue.`);
      return;
    }

    setState("working");
    setMessage(undefined);

    const result = await signUpWithEmail({
      name,
      email,
      password,
      role,
      institution: institution || undefined,
    });

    if (!result.ok) {
      setState("denied");
      setMessage(result.message);
      return;
    }

    if (result.needsConfirmation) {
      setState("granted");
      setMessage(
        "Account created. Check your inbox for the confirmation link, then sign in.",
      );
      setTimeout(() => void navigate({ to: "/login", search: { role, redirect } }), 2200);
      return;
    }

    setState("granted");
    setTimeout(
      () => void navigate({ to: roleById[role].to, replace: true }),
      reduced ? 60 : 700,
    );
  };

  return (
    <AuthShell
      wide
      label="ENROLMENT"
      heading="JOIN THE CIVICX NETWORK"
      subtitle="Create your operator profile and choose the force you represent."
      footer={
        <span className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ role, redirect }}
            className="text-cyan underline-offset-4 transition-colors hover:underline"
          >
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="FULL NAME"
          value={name}
          onChange={setName}
          placeholder="Your name"
          autoComplete="name"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label="EMAIL"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <AuthField
            label="PASSWORD"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>
        <AuthField
          label="CONFIRM PASSWORD"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />

        <div className="pt-2">
          <p className="mono-label text-muted-foreground">SELECT YOUR ROLE</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  whileHover={reduced ? {} : { y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  aria-pressed={active}
                  className={cn(
                    "glass-soft relative flex items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-colors motion-reduce:transform-none",
                    active ? "border-cyan/50" : "hover:border-cyan/30",
                  )}
                  style={
                    active
                      ? {
                          borderColor: `color-mix(in oklab, ${r.accent} 55%, transparent)`,
                          boxShadow: `0 0 26px -10px ${r.accent}`,
                          backgroundColor: `color-mix(in oklab, ${r.accent} 8%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border"
                    style={{
                      borderColor: `color-mix(in oklab, ${r.accent} 40%, transparent)`,
                      color: r.accent,
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block font-mono text-[11px] tracking-[0.2em]"
                      style={{ color: active ? r.accent : undefined }}
                    >
                      {r.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {r.tags.join(" · ")}
                    </span>
                  </span>
                  {active ? (
                    <Check className="ml-auto h-4 w-4 shrink-0" style={{ color: r.accent }} />
                  ) : null}
                </motion.button>
              );
            })}
          </div>
        </div>

        <AuthField
          label={orgLabel[role]}
          value={institution}
          onChange={setInstitution}
          optional={role === "citizen"}
          placeholder={role === "citizen" ? "Community group, if any" : "Required"}
          autoComplete="organization"
        />

        <motion.button
          type="submit"
          disabled={state === "working" || state === "granted"}
          whileHover={reduced ? {} : { y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group mt-2 inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-background shadow-[var(--shadow-glow-cyan)] transition-opacity disabled:opacity-70 motion-reduce:transform-none"
          style={{ backgroundImage: "var(--gradient-accent)" }}
        >
          {state === "working" ? "CREATING PROFILE..." : "JOIN NETWORK"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      </form>

      <AuthStatus state={state} message={message} />
    </AuthShell>
  );
}
