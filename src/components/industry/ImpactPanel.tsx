import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { Counter } from "@/components/civicx/Counter";
import { Reveal, SectionLabel } from "@/components/civicx/Reveal";
import { categoryLabel } from "@/lib/university-data";
import { collaborationStatusMeta, type CollaborationStatus } from "@/lib/industry-data";
import type { CollaborationEntry } from "@/lib/industry-service";

/** Impact readout built only from collaborations this organisation actually has. */
export function ImpactPanel({
  entries,
  loaded,
}: {
  entries: CollaborationEntry[];
  loaded: boolean;
}) {
  const engaged = entries.filter((e) => e.collaboration.status !== "DECLINED");
  const completed = engaged.filter((e) => e.collaboration.status === "COMPLETED");
  const citizens = engaged.reduce((sum, e) => sum + (e.mission?.estimated_impact ?? 0), 0);
  const sectors = new Set(
    engaged.map((e) => categoryLabel(e.mission?.category ?? null)),
  );
  const supportKinds = new Set(engaged.flatMap((e) => e.collaboration.support_types ?? []));

  const cards = [
    { label: "MISSIONS SUPPORTED", value: engaged.length, accent: "text-warn" },
    { label: "MISSIONS COMPLETED", value: completed.length, accent: "text-signal" },
    { label: "CITIZENS REACHABLE", value: citizens, accent: "text-cyan" },
    { label: "CIVIC SECTORS", value: sectors.size, accent: "text-violet" },
  ];

  return (
    <section className="space-y-6">
      <Reveal>
        <SectionLabel>IMPACT</SectionLabel>
        <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          What your support has set in motion
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          These figures come only from your own collaboration records and the civic
          challenges they are attached to.
        </p>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-2xl p-5"
          >
            <p className="mono-label text-muted-foreground">{c.label}</p>
            <p className={`mt-3 text-2xl font-semibold tracking-tight ${c.accent}`}>
              {loaded ? <Counter value={c.value} /> : "—"}
            </p>
          </motion.div>
        ))}
      </div>

      {loaded && engaged.length === 0 && (
        <div className="glass grid-floor rounded-2xl px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-warn/40 bg-warn/10 text-warn">
            <TrendingUp className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="mono-label mt-6 text-warn/90">NO IMPACT RECORDED YET</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Back a reviewed university solution and your impact will be tracked here.
          </p>
        </div>
      )}

      {engaged.length > 0 && (
        <>
          <div className="glass rounded-2xl p-5">
            <p className="mono-label text-muted-foreground">SUPPORT YOU HAVE COMMITTED</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...supportKinds].map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-warn"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="mono-label text-muted-foreground">MISSION LEDGER</p>
            <div className="mt-3 space-y-3">
              {engaged.map((e) => {
                const meta =
                  collaborationStatusMeta[e.collaboration.status as CollaborationStatus];
                return (
                  <div
                    key={e.collaboration.id}
                    className="glass-soft flex flex-wrap items-center justify-between gap-3 rounded-xl p-3.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {e.mission?.title ?? "Mission unavailable"}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                        {categoryLabel(e.mission?.category ?? null).toUpperCase()} ·{" "}
                        {e.mission?.location_name ?? "Location pending"}
                      </span>
                    </span>
                    <span
                      className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
