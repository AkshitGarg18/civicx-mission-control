import { useCallback, useEffect, useState } from "react";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import {
  CHALLENGE_CREATED_EVENT,
  getMapChallenges,
  subscribeToNewChallenges,
  type ChallengeRow,
} from "@/lib/challenges-service";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { UniversityStats } from "./UniversityStats";
import { MissionBoard } from "./MissionBoard";
import { UniversityMissionDetail } from "./UniversityMissionDetail";
import { ComingSoonPanel } from "./ComingSoonPanel";

/**
 * University mission control. Reads real challenge rows through the existing
 * RLS-backed service; only the mission board is functional in this version.
 */
export function UniversityDashboard() {
  const [active, setActive] = useState("mission-board");
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMapChallenges();
      setRows(data);
    } catch (err) {
      console.error("[civicx] university mission board load failed", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Stay current when a new signal lands, without recreating state. */
  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener(CHALLENGE_CREATED_EVENT, refresh);
    const unsubscribe = subscribeToNewChallenges(() => refresh());
    return () => {
      window.removeEventListener(CHALLENGE_CREATED_EVENT, refresh);
      unsubscribe();
    };
  }, [load]);

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative flex">
        <UniversitySidebar active={active} onNavigate={setActive} />

        <main className="min-w-0 flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-14">
            <UniversityHeader />

            {active === "mission-board" ? (
              <>
                <UniversityStats rows={rows} loaded={loaded} />
                <MissionBoard rows={rows} loaded={loaded} onView={setDetailId} />
              </>
            ) : (
              <ComingSoonPanel sectionId={active} />
            )}
          </div>
        </main>
      </div>

      <UniversityMissionDetail
        challengeId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
