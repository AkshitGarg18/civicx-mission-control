import { useState } from "react";
import { CitizenSidebar } from "./CitizenSidebar";
import { CitizenHeader } from "./CitizenHeader";
import { CivicStatus } from "./CivicStatus";
import { ReportSignal } from "./ReportSignal";
import { MyMissions } from "./MyMissions";
import { NearbyChallenges } from "./NearbyChallenges";
import { CommunityImpact } from "./CommunityImpact";
import { ReportModal } from "./ReportModal";

/** Citizen Mission Control — sidebar shell + dashboard sections + report flow. */
export function CitizenDashboard() {
  const [active, setActive] = useState("command-center");
  const [reportOpen, setReportOpen] = useState(false);

  const navigate = (id: string) => {
    setActive(id);
    if (id === "report") {
      setReportOpen(true);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen">
      <CitizenSidebar active={active} onNavigate={navigate} />

      <div className="lg:pl-64">
      <main className="mx-auto w-full max-w-6xl space-y-16 px-4 py-8 sm:px-6 lg:py-12">

        <CitizenHeader />
        <CivicStatus />
        <ReportSignal onOpen={() => setReportOpen(true)} />
        <MyMissions />
        <NearbyChallenges />
        <CommunityImpact />

        <footer className="border-t border-border pt-6 pb-4 font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
          CIVICX // CITIZEN CONSOLE — DEMO DATA
        </footer>
      </main>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
