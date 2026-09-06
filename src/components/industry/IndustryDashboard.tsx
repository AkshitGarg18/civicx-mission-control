import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Radio, X } from "lucide-react";
import { AmbientBackground } from "@/components/civicx/AmbientBackground";
import {
  COLLABORATION_CREATED_EVENT,
  getMyCollaborations,
  getOpportunities,
  getOrganizationProfile,
  subscribeToIndustrySignals,
  type CollaborationEntry,
  type Opportunity,
  type ProfileRow,
} from "@/lib/industry-service";
import { IndustrySidebar } from "./IndustrySidebar";
import { IndustryHeader } from "./IndustryHeader";
import { CommandCenter } from "./CommandCenter";
import { OpportunitiesPanel } from "./OpportunitiesPanel";
import { OpportunityDetail } from "./OpportunityDetail";
import { ExpressInterestModal } from "./ExpressInterestModal";
import { CollaborationsPanel } from "./CollaborationsPanel";
import { OrganizationProfilePanel } from "./OrganizationProfilePanel";
import { ImpactPanel } from "./ImpactPanel";

/**
 * Industry Innovation Command. Reads reviewed solution proposals and real
 * collaboration records through the RLS-backed service; nothing here is mock.
 */
export function IndustryDashboard() {
  const [active, setActive] = useState("command-center");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [collaborations, setCollaborations] = useState<CollaborationEntry[]>([]);
  const [collabLoaded, setCollabLoaded] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [interestOpen, setInterestOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadOpportunities = useCallback(async () => {
    try {
      setOpportunities(await getOpportunities());
    } catch (err) {
      console.error("[civicx] opportunities load failed", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  const loadCollaborations = useCallback(async () => {
    try {
      setCollaborations(await getMyCollaborations());
    } catch (err) {
      console.error("[civicx] collaborations load failed", err);
    } finally {
      setCollabLoaded(true);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await getOrganizationProfile());
    } catch (err) {
      console.error("[civicx] organisation profile load failed", err);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadOpportunities();
    void loadCollaborations();
    void loadProfile();
  }, [loadOpportunities, loadCollaborations, loadProfile]);

  /** Refresh when this organisation, or anyone else, engages a solution. */
  useEffect(() => {
    const refresh = () => {
      void loadOpportunities();
      void loadCollaborations();
    };
    window.addEventListener(COLLABORATION_CREATED_EVENT, refresh);
    const unsubscribe = subscribeToIndustrySignals(() => refresh());
    return () => {
      window.removeEventListener(COLLABORATION_CREATED_EVENT, refresh);
      unsubscribe();
    };
  }, [loadOpportunities, loadCollaborations]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const openOpportunity = useMemo(
    () => opportunities.find((o) => o.proposal.id === openId) ?? null,
    [opportunities, openId],
  );

  const organizationName = profile?.institution ?? profile?.name ?? null;
  const openCount = opportunities.filter((o) => !o.mine).length;

  const view = (proposalId: string) => {
    setActive("opportunities");
    setOpenId(proposalId);
  };

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <div className="relative flex">
        <IndustrySidebar
          active={active}
          signals={openCount}
          onNavigate={(id) => {
            setOpenId(null);
            setActive(id);
          }}
        />

        <main className="min-w-0 flex-1 px-4 pb-20 pt-6 sm:px-6 lg:pl-[18.5rem] lg:pr-10">
          <div className="mx-auto max-w-6xl space-y-14">
            <IndustryHeader organization={organizationName} />

            {active === "command-center" && (
              <CommandCenter
                opportunities={opportunities}
                collaborations={collaborations}
                profile={profile}
                loaded={loaded && collabLoaded}
                onOpenOpportunity={view}
                onOpenSection={setActive}
              />
            )}

            {active === "opportunities" &&
              (openOpportunity ? (
                <OpportunityDetail
                  opportunity={openOpportunity}
                  profile={profile}
                  onBack={() => setOpenId(null)}
                  onExpressInterest={() => setInterestOpen(true)}
                />
              ) : (
                <OpportunitiesPanel
                  opportunities={opportunities}
                  profile={profile}
                  loaded={loaded}
                  onView={setOpenId}
                />
              ))}

            {active === "collaborations" && (
              <CollaborationsPanel
                entries={collaborations}
                loaded={collabLoaded}
                onChanged={() => {
                  void loadCollaborations();
                  void loadOpportunities();
                }}
              />
            )}

            {active === "organization" && (
              <OrganizationProfilePanel
                profile={profile}
                loaded={profileLoaded}
                onSaved={() => void loadProfile()}
              />
            )}

            {active === "impact" && (
              <ImpactPanel entries={collaborations} loaded={collabLoaded} />
            )}
          </div>
        </main>
      </div>

      <ExpressInterestModal
        opportunity={openOpportunity}
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
        onDone={() => {
          setToast("Industry signal sent — the university team can now see your offer.");
          void loadOpportunities();
          void loadCollaborations();
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="glass fixed bottom-6 left-1/2 z-[90] flex w-[min(92vw,26rem)] -translate-x-1/2 items-start gap-3 rounded-2xl p-4"
          >
            <Radio className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
            <p className="flex-1 text-sm text-foreground/90">{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
