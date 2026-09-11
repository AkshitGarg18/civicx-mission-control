import { useState } from "react";
import { motion } from "motion/react";
import { CopyCheck, ExternalLink, Loader2, MapPin, Users } from "lucide-react";
import type { DuplicateMatch } from "@/lib/duplicates.functions";
import {
  getCanonicalChallenge,
  setDuplicateLink,
  type CanonicalChallenge,
} from "@/lib/duplicates-service";
import { PriorityChip } from "@/components/civicx/StatusChip";

const distanceLabel = (m: number | null) => {
  if (m === null) return "Distance unavailable";
  if (m < 1000) return `~${Math.round(m)} m away`;
  return `~${(m / 1000).toFixed(1)} km away`;
};

/**
 * Advisory "possible duplicate" panel. Non-blocking: the citizen's report is
 * already saved and is never removed, whichever action they choose.
 */
export function DuplicateAlert({ matches }: { matches: DuplicateMatch[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = matches.filter((m) => !dismissed.includes(m.relationshipId));
  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass mt-4 rounded-2xl border border-warn/40 p-4"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-warn/40 bg-warn/10">
          <CopyCheck className="h-4 w-4 text-warn" />
        </span>
        <div>
          <p className="mono-label text-warn">POSSIBLE DUPLICATE DETECTED</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your report is saved. CivicX AI thinks it may describe a problem someone
            already reported — this is an AI suggestion, not a confirmation.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {visible.map((match) => (
          <MatchCard
            key={match.relationshipId}
            match={match}
            onResolved={() => setDismissed((d) => [...d, match.relationshipId])}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MatchCard({
  match,
  onResolved,
}: {
  match: DuplicateMatch;
  onResolved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<CanonicalChallenge | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldLink =
    match.classification === "SAME_ISSUE" ||
    match.recommendedAction === "LINK_TO_EXISTING";

  const view = async () => {
    if (detail) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setError(null);
    const row = await getCanonicalChallenge(match.challengeId);
    setLoadingDetail(false);
    if (!row) {
      setError("We could not open that challenge right now.");
      return;
    }
    setDetail(row);
  };

  const submitAnyway = async () => {
    setBusy(true);
    setError(null);
    try {
      // Their report always stays. When the AI judged it the same underlying
      // issue, it is kept as a supporting report on the existing challenge.
      await setDuplicateLink(match.relationshipId, shouldLink);
      onResolved();
    } catch (err) {
      console.error("[civicx] duplicate decision failed", err);
      setError("We could not save that just now. Your report is still saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-soft rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{match.title}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            <span className="text-azure">
              {(match.category ?? "UNCATEGORISED").toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.locationName ?? "Location pending"}
            </span>
            <span>{distanceLabel(match.distanceM)}</span>
          </p>
        </div>
        <PriorityChip priority={match.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Stat
          label="RELATED REPORTS"
          value={`${match.reportCount}`}
          icon={<Users className="h-3.5 w-3.5 text-cyan" />}
        />
        <Stat label="AI CONFIDENCE" value={`${match.confidence}%`} />
        <Stat
          label="AI VIEW"
          value={match.classification === "SAME_ISSUE" ? "Likely same issue" : "Potential duplicate"}
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/85">{match.reason}</p>

      {detail && (
        <div className="mt-3 rounded-xl border border-border/70 p-3">
          <p className="mono-label text-muted-foreground">EXISTING CHALLENGE</p>
          <p className="mt-2 text-sm font-semibold">{detail.title}</p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            {(detail.category ?? "UNCATEGORISED").toUpperCase()} ·{" "}
            {detail.location_name ?? "Location pending"} · {detail.report_count} CITIZEN
            REPORT{detail.report_count === 1 ? "" : "S"}
          </p>
          {detail.ai_summary && (
            <p className="mt-2 text-sm leading-relaxed text-foreground/85">
              {detail.ai_summary}
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => void view()}
          disabled={loadingDetail}
          className="inline-flex items-center gap-2 rounded-xl border border-azure/40 bg-azure/10 px-3.5 py-2 font-mono text-[10px] font-semibold tracking-[0.16em] text-azure transition-colors hover:border-azure/70 disabled:opacity-50"
        >
          {loadingDetail ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
          {detail ? "HIDE EXISTING CHALLENGE" : "VIEW EXISTING CHALLENGE"}
        </button>
        <button
          type="button"
          onClick={() => void submitAnyway()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          SUBMIT ANYWAY
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-muted-foreground/80">
        {shouldLink
          ? "SUBMIT ANYWAY KEEPS YOUR REPORT AND ADDS IT AS A SUPPORTING REPORT"
          : "SUBMIT ANYWAY KEEPS YOUR REPORT AS ITS OWN CHALLENGE"}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 px-3 py-2">
      <p className="mono-label text-muted-foreground">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {value}
      </p>
    </div>
  );
}
