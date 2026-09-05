import { useCallback, useEffect, useState } from "react";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import {
  CHALLENGE_CREATED_EVENT,
  getMapChallenges,
  subscribeToNewChallenges,
  type ChallengeRow,
} from "@/lib/challenges-service";
import { getMyTeams, type TeamWithMembers } from "@/lib/teams-service";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { UniversityStats } from "./UniversityStats";
import { MissionBoard } from "./MissionBoard";
import { UniversityMissionDetail } from "./UniversityMissionDetail";
import { ComingSoonPanel } from "./ComingSoonPanel";
import { TeamsPanel } from "./TeamsPanel";
import { TeamDetail } from "./TeamDetail";

/**
 * University mission control. Reads real challenge rows and real team records
 * through the RLS-backed services; nothing here is mock data.
 */
export function UniversityDashboard() {
  const [active, setActive] = useState("mission-board");
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

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

  const loadTeams = useCallback(async () => {
    try {
      setTeams(await getMyTeams());
    } catch (err) {
      console.error("[civicx] team records load failed", err);
    } finally {
      setTeamsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadTeams();
  }, [load, loadTeams]);

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

  const afterTeamCreated = () => {
    void load();
    void loadTeams();
  };

  const openTeam = teams.find((t) => t.team.id === openTeamId) ?? null;

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative flex">
        <UniversitySidebar
          active={active}
          onNavigate={(id) => {
            setOpenTeamId(null);
            setActive(id);
          }}
        />

        <main className="min-w-0 flex-1 px-4 pb-20 pt-6 sm:px-6 lg:pl-[18.5rem] lg:pr-10">
          <div className="mx-auto max-w-6xl space-y-14">
            <UniversityHeader />

            {active === "mission-board" && (
              <>
                <UniversityStats rows={rows} loaded={loaded} teams={teams} />
                <MissionBoard rows={rows} loaded={loaded} onView={setDetailId} />
              </>
            )}

            {active === "teams" &&
              (openTeam ? (
                <TeamDetail
                  entry={openTeam}
                  mission={rows.find((r) => r.id === openTeam.team.mission_id) ?? null}
                  onBack={() => setOpenTeamId(null)}
                />
              ) : (
                <TeamsPanel
                  view="teams"
                  entries={teams}
                  missions={rows}
                  loaded={teamsLoaded}
                  onOpenTeam={setOpenTeamId}
                  onOpenMission={setDetailId}
                />
              ))}

            {active === "my-missions" && (
              <TeamsPanel
                view="missions"
                entries={teams}
                missions={rows}
                loaded={teamsLoaded}
                onOpenTeam={setOpenTeamId}
                onOpenMission={setDetailId}
              />
            )}

            {active !== "mission-board" &&
              active !== "teams" &&
              active !== "my-missions" && <ComingSoonPanel sectionId={active} />}
          </div>
        </main>
      </div>

      <UniversityMissionDetail
        challengeId={detailId}
        onClose={() => setDetailId(null)}
        onTeamCreated={afterTeamCreated}
        onViewTeam={(id) => {
          setDetailId(null);
          setActive("teams");
          setOpenTeamId(id);
        }}
      />
    </div>
  );
}
