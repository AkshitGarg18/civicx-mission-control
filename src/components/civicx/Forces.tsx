import { motion } from "motion/react";
import { Users, GraduationCap, Factory, Landmark } from "lucide-react";
import { forces } from "@/lib/civicx-data";
import { Reveal, SectionLabel } from "./Reveal";

const icons = [Users, GraduationCap, Factory, Landmark];
const accents = ["var(--neon-cyan)", "var(--neon-azure)", "var(--warn)", "var(--neon-violet)"];

export function Forces() {
  return (
    <section id="forces" className="relative scroll-mt-28 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <SectionLabel>Operating Model</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            One Challenge. Four Forces.{" "}
            <span className="text-gradient">One Solution.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {forces.map((f, i) => {
            const Icon = icons[i]!;
            const accent = accents[i]!;
            return (
              <Reveal key={f.key} delay={i * 0.1}>
                <motion.article
                  whileHover={{ y: -8, rotateX: 4, rotateY: -3 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  style={{ transformPerspective: 900 }}
                  className="glass glow-ring group relative h-full overflow-hidden rounded-3xl p-6"
                >
                  <span
                    className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-15 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                    style={{ backgroundColor: accent }}
                  />
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl border"
                    style={{
                      borderColor: `color-mix(in oklab, ${accent} 40%, transparent)`,
                      backgroundColor: `color-mix(in oklab, ${accent} 12%, transparent)`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                  </span>
                  <p className="mt-5 font-mono text-xs tracking-[0.22em]" style={{ color: accent }}>
                    {f.key}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{f.line}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.detail}
                  </p>
                  <span
                    className="mt-6 block h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ backgroundImage: "var(--gradient-accent)" }}
                  />
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
