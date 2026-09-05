import { motion, useReducedMotion } from "motion/react";
import { Rocket } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "./Reveal";

const MotionLink = motion.create(Link);

export function FinalCTA() {
  const reduced = useReducedMotion();

  return (
    <section id="launch" className="relative scroll-mt-28 px-4 py-24 sm:px-6 lg:py-36">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 lg:py-24">
            <span
              className="absolute inset-0 opacity-60"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            />
            <span className="absolute inset-0 grid-floor opacity-40" />
            {!reduced && (
              <motion.span
                className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
                style={{ backgroundColor: "var(--neon-azure)", opacity: 0.18 }}
                animate={{ opacity: [0.1, 0.24, 0.1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold leading-tight sm:text-5xl lg:text-[3.5rem]">
                Your City Has Problems.
                <br />
                <span className="text-gradient">Let's Build The Solutions.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
                Join the network turning local challenges into measurable, verified outcomes.
              </p>
              <MotionLink
                to="/access"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-10 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-medium text-primary-foreground"
                style={{
                  backgroundImage: "var(--gradient-accent)",
                  boxShadow: "var(--shadow-glow-cyan)",
                }}
              >
                <Rocket className="h-4 w-4" />
                Launch CivicX
              </MotionLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
