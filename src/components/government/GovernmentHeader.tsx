import { motion } from "motion/react";

/** Console masthead. The organisation name comes from the stored profile. */
export function GovernmentHeader({ organization }: { organization: string | null }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3"
    >
      <p className="mono-label text-muted-foreground">
        CIVICX <span className="text-violet">//</span> GOVERNMENT CONSOLE
        {organization ? ` // ${organization.toUpperCase()}` : ""}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        GOVERNMENT COMMAND CENTER
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Monitor civic challenges, solution progress and cross-sector collaboration.
      </p>
    </motion.header>
  );
}
