import { lazy, Suspense, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { MissionRecord } from "@/lib/government-service";

const ChallengeMap = lazy(() => import("@/components/citizen/ChallengeMap"));

const Fallback = () => (
  <div className="grid h-full w-full place-items-center rounded-2xl border border-border/70 bg-background/60">
    <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
      LOADING TERRAIN…
    </p>
  </div>
);

/**
 * Live civic map. Reuses the existing MapLibre component and its visual
 * language; markers come only from stored challenge coordinates.
 */
export function LiveMapPanel({
  missions,
  reduced,
  onOpenMission,
}: {
  missions: MissionRecord[];
  reduced: boolean;
  onOpenMission: (challengeId: string) => void;
}) {
  const rows = useMemo(() => missions.map((m) => m.challenge), [missions]);
  const placed = rows.filter(
    (r) => typeof r.latitude === "number" && typeof r.longitude === "number",
  ).length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label text-muted-foreground">LIVE CIVIC MAP</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">LIVE MAP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Geographic view of the filtered civic missions. Click a marker to open its
            mission record.
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
          {placed} / {rows.length} MISSIONS GEOLOCATED
        </span>
      </div>

      <div className="h-[32rem]">
        <ClientOnly fallback={<Fallback />}>
          <Suspense fallback={<Fallback />}>
            <ChallengeMap
              rows={rows}
              arriving={[]}
              reduced={reduced}
              onViewMission={onOpenMission}
            />
          </Suspense>
        </ClientOnly>
      </div>
    </section>
  );
}
