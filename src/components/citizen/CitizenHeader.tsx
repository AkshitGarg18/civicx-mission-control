import { motion } from "motion/react";
import { Bell } from "lucide-react";
import { Reveal } from "@/components/civicx/Reveal";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Dashboard greeting bar with live network readout. */
export function CitizenHeader() {
  const hello = greeting(new Date().getHours());

  return (
    <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          {hello}, <span className="text-gradient">Citizen.</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Let&apos;s turn today&apos;s problems into tomorrow&apos;s solutions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="glass-soft inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-signal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 motion-safe:animate-ping" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          NETWORK ONLINE
        </span>
        <motion.button
          type="button"
          aria-label="Notifications"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="glass-soft relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transform-none"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warn shadow-[0_0_8px_var(--warn)]" />
        </motion.button>
      </div>
    </Reveal>
  );
}
