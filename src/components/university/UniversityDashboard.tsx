import { useCallback, useEffect, useState } from "react";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import {
  CHALLENGE_CREATED_EVENT,
  getMapChallenges,
  subscribeToNewChallenges,
  type ChallengeRow,
} from "@/lib/challenges-service";
import { getMyTeams, type TeamWithMembers } from "@/lib/teams-service";
import { getMyProposals, type ProposalRow } from "@/lib/proposals-service";
import { useAuth } from "@/lib/auth-context";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityHeader } from "./UniversityHeader";
import { UniversityStats } from "./UniversityStats";
import { MissionBoard } from "./MissionBoard";
import { UniversityMissionDetail } from "./UniversityMissionDetail";
import { ComingSoonPanel } from "./ComingSoonPanel";
import { TeamsPanel } from "./TeamsPanel";
import { TeamDetail } from "./TeamDetail";
import { ProposalWorkspace } from "./ProposalWorkspace";
import { ProposalView } from "./ProposalView";

/**
 * University mission control. Reads real challenge rows, real team records and
 * real solution proposals through the RLS-backed services.
 */
export function UniversityDashboard() {
  const { currentUser } = useAuth();
  const [active, setActive] = useState("mission-board");
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Map<string, ProposalRow>>(new Map());
  const [stage, setStage] = useState<"team" | "workspace" | "proposal">("team");
  const [autoReview, setAutoReview] = useState(false);

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
      setProposals(await getMyProposals());
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
  const openMission = openTeam
    ? rows.find((r) => r.id === openTeam.team.mission_id) ?? null
    : null;
  const openProposal = openTeam ? proposals.get(openTeam.team.id) ?? null : null;
  const isLeader = Boolean(
    openTeam &&
      currentUser &&
      (openTeam.team.created_by === currentUser.id ||
        openTeam.members.some((m) => m.user_id === currentUser.id && m.is_leader)),
  );

  const rememberProposal = (row: ProposalRow) => {
    setProposals((prev) => new Map(prev).set(row.team_id, row));
  };

  const showTeam = (id: string) => {
    setOpenTeamId(id);
    setStage("team");
    setAutoReview(false);
  };

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative flex">
        <UniversitySidebar
          active={active}
          onNavigate={(id) => {
            setOpenTeamId(null);
            setStage("team");
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
                stage === "workspace" ? (
                  <ProposalWorkspace
                    entry={openTeam}
                    mission={openMission}
                    proposal={openProposal}
                    userId={currentUser?.id ?? ""}
                    isLeader={isLeader}
                    onBack={() => setStage("team")}
                    onSaved={rememberProposal}
                    onSubmitted={(row) => {
                      rememberProposal(row);
                      setAutoReview(true);
                      setStage("proposal");
                      void load();
                    }}
                  />
                ) : stage === "proposal" && openProposal ? (
                  <ProposalView
                    entry={openTeam}
                    mission={openMission}
                    proposal={openProposal}
                    autoReview={autoReview}
                    onBack={() => setStage("team")}
                    onStatusChange={(status) => {
                      rememberProposal({ ...openProposal, status });
                      void load();
                    }}
                  />
                ) : (
                  <TeamDetail
                    entry={openTeam}
                    mission={openMission}
                    proposal={openProposal}
                    onBack={() => setOpenTeamId(null)}
                    onCreateProposal={() => setStage("workspace")}
                    onOpenProposal={() => {
                      setAutoReview(false);
                      setStage(openProposal?.status === "DRAFT" ? "workspace" : "proposal");
                    }}
                  />
                )
              ) : (
                <TeamsPanel
                  view="teams"
                  entries={teams}
                  missions={rows}
                  proposals={proposals}
                  loaded={teamsLoaded}
                  onOpenTeam={showTeam}
                  onOpenMission={setDetailId}
                />
              ))}

            {active === "my-missions" && (
              <TeamsPanel
                view="missions"
                entries={teams}
                missions={rows}
                proposals={proposals}
                loaded={teamsLoaded}
                onOpenTeam={showTeam}
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
          showTeam(id);
        }}
      />
    </div>
  );
}
