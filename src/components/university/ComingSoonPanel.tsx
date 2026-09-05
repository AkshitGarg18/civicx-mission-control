import { motion } from "motion/react";
import { universityNav } from "@/lib/university-data";

/** Honest placeholder for the university sections that are not built yet. */
export function ComingSoonPanel({ sectionId }: { sectionId: string }) {
  const item = universityNav.find((n) => n.id === sectionId);
  const Icon = item?.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass grid-floor rounded-2xl px-6 py-20 text-center"
    >
      {Icon && (
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-violet/40 bg-violet/10 text-violet">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
      )}
      <p className="mono-label mt-6 text-violet/90">
        {(item?.label ?? "Module").toUpperCase()} — COMING SOON
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        This part of the university console is not active yet. The Mission Board is live
        and shows every civic challenge available to your university.
      </p>
    </motion.section>
  );
}
