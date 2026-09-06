import { useCallback, useEffect, useState } from "react";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import {
  CHALLENGE_CREATED_EVENT,
  getMapChallenges,
  subscribeToNewChallenges,
  type ChallengeRow,
} from "@/lib/challenges-service";
import { getMyTeams, type TeamWithMembers } from "@/lib/teams-service";
import { useAuth } from "@/lib/auth-context";
import {
  getMyProposals,
  getProposalReview,
  getTeamCollaborationStatuses,
  type ProposalRow,
} from "@/lib/proposals-service";
import { ProposalWorkspace } from "./ProposalWorkspace";
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
  const [proposalTeamId, setProposalTeamId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [reviewedTeams, setReviewedTeams] = useState<Set<string>>(new Set());
  const [collabStatuses, setCollabStatuses] = useState<Map<string, string>>(new Map());
  const { currentUser } = useAuth();

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

  const loadProposals = useCallback(async () => {
    try {
      const rowsFound = await getMyProposals();
      setProposals(rowsFound);

      const reviewed = new Set<string>();
      await Promise.all(
        rowsFound
          .filter((p) => p.status === "AI_REVIEW_COMPLETE")
          .map(async (p) => {
            const review = await getProposalReview(p.id);
            if (review) reviewed.add(p.team_id);
          }),
      );
      setReviewedTeams(reviewed);
      setCollabStatuses(await getTeamCollaborationStatuses());
    } catch (err) {
      console.error("[civicx] proposal records load failed", err);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadTeams();
    void loadProposals();
  }, [load, loadTeams, loadProposals]);

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
    void loadProposals();
  };

  /** team id -> stored proposal, newest first from the service order. */
  const proposalByTeam = new Map<string, ProposalRow>();
  for (const p of proposals) if (!proposalByTeam.has(p.team_id)) proposalByTeam.set(p.team_id, p);
  const proposalStatuses = new Map(
    [...proposalByTeam].map(([teamId, p]) => [teamId, p.status] as const),
  );

  const openTeam = teams.find((t) => t.team.id === openTeamId) ?? null;
  const proposalTeam = teams.find((t) => t.team.id === proposalTeamId) ?? null;

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative flex">
        <UniversitySidebar
          active={active}
          onNavigate={(id) => {
            setOpenTeamId(null);
            setProposalTeamId(null);
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

            {(active === "teams" || active === "proposals") &&
              (proposalTeam ? (
                <ProposalWorkspace
                  entry={proposalTeam}
                  mission={
                    rows.find((r) => r.id === proposalTeam.team.mission_id) ?? null
                  }
                  currentUserId={currentUser?.id ?? null}
                  onBack={() => {
                    setProposalTeamId(null);
                    void loadProposals();
                  }}
                  onViewIndustryInterest={() => {
                    setProposalTeamId(null);
                    setActive("teams");
                    setOpenTeamId(proposalTeam.team.id);
                  }}
                  onChanged={() => void loadProposals()}
                />
              ) : openTeam ? (
                <TeamDetail
                  entry={openTeam}
                  mission={rows.find((r) => r.id === openTeam.team.mission_id) ?? null}
                  proposalStatus={proposalStatuses.get(openTeam.team.id) ?? null}
                  onBack={() => setOpenTeamId(null)}
                  onOpenProposal={() => setProposalTeamId(openTeam.team.id)}
                />
              ) : (
                <TeamsPanel
                  view="teams"
                  entries={teams}
                  missions={rows}
                  loaded={teamsLoaded}
                  proposalStatuses={proposalStatuses}
                  reviewedProposals={reviewedTeams}
                  collaborationStatuses={collabStatuses}
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
                proposalStatuses={proposalStatuses}
                reviewedProposals={reviewedTeams}
                collaborationStatuses={collabStatuses}
                onOpenTeam={setOpenTeamId}
                onOpenMission={setDetailId}
              />
            )}

            {active !== "mission-board" &&
              active !== "teams" &&
              active !== "proposals" &&
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
