import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AuthField, AuthShell, AuthStatus } from "./AuthShell";
import { signInWithEmail } from "@/lib/auth-service";
import { roleById, type RoleId } from "@/lib/civicx-roles";

type State = "idle" | "working" | "granted" | "denied";

/** ACCESS CIVICX — email + password sign-in console. */

function authSearch(role?: RoleId, redirect?: string) {
  return {
    ...(role ? { role } : {}),
    ...(redirect ? { redirect } : {}),
  };
}

/** ACCESS CIVICX form body. */
export function LoginForm({
  role,
  redirect,
}: {
  role?: RoleId | undefined;
  redirect?: string | undefined;
}) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | undefined>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "working" || state === "granted") return;

    if (!email.trim() || !password) {
      setState("denied");
      setMessage("Enter both your email and password to continue.");
      return;
    }

    setState("working");
    setMessage(undefined);

    const result = await signInWithEmail(email, password);
    if (!result.ok) {
      setState("denied");
      setMessage(result.message);
      return;
    }

    setState("granted");
    const target = result.role ? roleById[result.role].to : "/citizen";
    setTimeout(() => void navigate({ to: target, replace: true }), reduced ? 60 : 700);
  };

  return (
    <AuthShell
      label="ACCESS"
      heading="ACCESS CIVICX"
      subtitle="Enter the CivicX network and continue your mission."
      footer={
        <span className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            search={authSearch(role, redirect)}
            className="text-cyan underline-offset-4 transition-colors hover:underline"
          >
            Create one
          </Link>
        </span>
      }
    >
      {role ? (
        <p className="mb-5 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          SELECTED ROLE
          <span style={{ color: roleById[role].accent }}>{roleById[role].title}</span>
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
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
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <motion.button
          type="submit"
          disabled={state === "working" || state === "granted"}
          whileHover={reduced ? {} : { y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group mt-2 inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-background shadow-[var(--shadow-glow-cyan)] transition-opacity disabled:opacity-70 motion-reduce:transform-none"
          style={{ backgroundImage: "var(--gradient-accent)" }}
        >
          {state === "working" ? "AUTHENTICATING..." : "AUTHENTICATE"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </motion.button>
      </form>

      <AuthStatus state={state} message={message} />
    </AuthShell>
  );
}
