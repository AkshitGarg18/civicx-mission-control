import { Hexagon } from "lucide-react";

const links = ["About", "Challenges", "Universities", "Industry", "Government", "Contact"];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/70 px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative grid h-8 w-8 shrink-0 place-items-center">
              <Hexagon className="h-8 w-8 text-cyan/70" strokeWidth={1.2} />
              <span className="absolute h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_var(--neon-cyan)]" />
            </span>
            <span className="truncate font-display text-base font-semibold">
              Civic<span className="text-gradient">X</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Technology for measurable societal impact.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-3">
          {links.map((l) => (
            <a
              key={l}
              href="#top"
              className="text-sm text-muted-foreground transition-colors hover:text-cyan"
            >
              {l}
            </a>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70">
        © {new Date().getFullYear()} CIVICX · DEMO DATA · UI PREVIEW BUILD
      </p>
    </footer>
  );
}
