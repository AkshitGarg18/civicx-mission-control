import { motion } from "motion/react";
import { steps } from "@/lib/civicx-data";
import { Reveal, SectionLabel } from "./Reveal";
import { StatusChip } from "./StatusChip";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-32 px-4 py-24 sm:px-6 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <SectionLabel>Lifecycle</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            How It <span className="text-gradient">Works.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every challenge follows the same tracked path, with a status signal at each stage.
          </p>
        </Reveal>

        <div className="relative mt-14">
          {/* timeline rail */}
          <motion.span
            className="absolute left-0 top-6 hidden h-px w-full origin-left lg:block"
            style={{ backgroundImage: "var(--gradient-accent)", opacity: 0.55 }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <span className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-cyan/40 via-violet/25 to-transparent sm:block lg:hidden" />

          <ol className="grid gap-8 sm:gap-10 lg:grid-cols-5">
            {steps.map((s, i) => (
              <Reveal key={s.no} delay={i * 0.12}>
                <li className="relative pl-16 sm:pl-16 lg:pl-0">
                  <span className="absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-2xl border border-cyan/30 bg-background/70 font-mono text-sm text-cyan shadow-[var(--shadow-glow-cyan)] lg:relative lg:mb-5">
                    {s.no}
                  </span>
                  <h3 className="font-mono text-sm tracking-[0.22em] text-foreground">
                    {s.title}
                  </h3>
                  <span className="mt-2 block">
                    <StatusChip status={s.signal} />
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
