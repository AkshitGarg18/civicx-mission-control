import { useCallback, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import { useAuth } from "@/lib/auth-context";
import {
  applyFilters,
  emptyOverview,
  getCivicOverview,
  storedCategories,
  subscribeToCivicOperations,
  type CivicOverview,
  type LiveEvent,
} from "@/lib/government-service";
import { emptyFilters, type GovernmentFilters } from "@/lib/government-data";
import { GovernmentSidebar } from "./GovernmentSidebar";
import { GovernmentHeader } from "./GovernmentHeader";
import { GovernmentFiltersBar } from "./GovernmentFiltersBar";
import { CommandCenterPanel } from "./CommandCenterPanel";
import { MissionsPanel } from "./MissionsPanel";
import { MissionControlDetail } from "./MissionControlDetail";
import { LiveMapPanel } from "./LiveMapPanel";
import { TeamsSolutionsPanel } from "./TeamsSolutionsPanel";
import { IndustryCollaborationPanel } from "./IndustryCollaborationPanel";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { OrganizationProfilePanel } from "./OrganizationProfilePanel";

/** Sections where the oversight filters apply. */
const filterable = new Set(["command-center", "missions", "map", "teams", "industry", "analytics"]);

/**
 * Government console. Read-only oversight of the whole civic pipeline: every
 * record comes from the real database through the government RLS policies.
 */
export function GovernmentDashboard() {
  const reduced = useReducedMotion() ?? false;
  const { currentProfile } = useAuth();

  const [active, setActive] = useState("command-center");
  const [overview, setOverview] = useState<CivicOverview>(emptyOverview);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GovernmentFilters>(emptyFilters);
  const [openMissionId, setOpenMissionId] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const load = useCallback(async () => {
    try {
      setOverview(await getCivicOverview());
      setError(null);
    } catch (e) {
      console.error("[civicx] government overview failed", e);
      setError("We could not load the civic record. Please try again.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* Live oversight feed — refreshes the record and posts an in-app notice. */
  useEffect(() => {
    return subscribeToCivicOperations((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 8));
      void load();
    });
  }, [load]);

  const missions = overview.missions;
  const filtered = useMemo(() => applyFilters(missions, filters), [missions, filters]);
  const categories = useMemo(() => storedCategories(missions), [missions]);
  const openMission = useMemo(
    () => missions.find((m) => m.challenge.id === openMissionId) ?? null,
    [missions, openMissionId],
  );

  const goto = (id: string) => {
    setOpenMissionId(null);
    setActive(id);
  };

  const openControl = (challengeId: string) => {
    setOpenMissionId(challengeId);
    setActive("missions");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />
      <GovernmentSidebar active={active} onNavigate={goto} signals={missions.length} />

      <main className="relative px-4 pb-20 pt-8 sm:px-6 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <GovernmentHeader organization={currentProfile?.institution ?? null} />

          {error && (
            <p className="glass rounded-2xl border-destructive/40 p-4 text-sm text-destructive">
              {error}
            </p>
          )}

          {filterable.has(active) && !openMission && (
            <GovernmentFiltersBar
              filters={filters}
              categories={categories}
              onChange={setFilters}
              matched={filtered.length}
              total={missions.length}
            />
          )}

          {active === "command-center" && (
            <CommandCenterPanel missions={filtered} events={events} loaded={loaded} />
          )}

          {active === "missions" &&
            (openMission ? (
              <MissionControlDetail
                mission={openMission}
                onBack={() => setOpenMissionId(null)}
              />
            ) : (
              <MissionsPanel missions={filtered} loaded={loaded} onOpen={openControl} />
            ))}

          {active === "map" && (
            <LiveMapPanel missions={filtered} reduced={reduced} onOpenMission={openControl} />
          )}

          {active === "teams" && (
            <TeamsSolutionsPanel missions={filtered} loaded={loaded} onOpen={openControl} />
          )}

          {active === "industry" && (
            <IndustryCollaborationPanel
              missions={filtered}
              loaded={loaded}
              onOpen={openControl}
            />
          )}

          {active === "analytics" && <AnalyticsPanel missions={filtered} />}

          {active === "organization" && <OrganizationProfilePanel />}
        </div>
      </main>
    </div>
  );
}
