import { BrandLogo } from "./BrandLogo";

const links = ["About", "Challenges", "Universities", "Industry", "Government", "Contact"];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/70 px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <BrandLogo className="h-11 w-auto object-left" />
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
