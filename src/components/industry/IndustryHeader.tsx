import { Reveal } from "@/components/civicx/Reveal";
import { UserMenu } from "@/components/auth/UserMenu";

/** Industry console header with the live opportunity readout. */
export function IndustryHeader({ organization }: { organization: string | null }) {
  return (
    <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mono-label text-warn/90">CIVICX // INNOVATION COMMAND</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          INDUSTRY <span className="text-gradient">ACCELERATION</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          {organization
            ? `${organization} — turn reviewed university solutions into deployed civic impact.`
            : "Find reviewed university solutions and accelerate them into real deployment."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="glass-soft inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          LIVE SOLUTION FEED
          <span className="inline-flex items-center gap-1.5 text-signal">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            LIVE
          </span>
        </span>
        <div className="hidden w-60 lg:block">
          <UserMenu />
        </div>
      </div>
    </Reveal>
  );
}
