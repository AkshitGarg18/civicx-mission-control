import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Lets a screen tell CivicX AI what the operator is currently looking at.
 *
 * Only identifiers travel through here. The assistant re-reads those records
 * server-side with the caller's own session, so Row Level Security still
 * decides what may be seen — publishing a focus never widens access.
 */
export interface AssistantFocus {
  missionId?: string | null;
  teamId?: string | null;
  proposalId?: string | null;
  label?: string | null;
}

interface AssistantContextValue {
  focus: AssistantFocus;
  setFocus: (focus: AssistantFocus) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState<AssistantFocus>({});
  const value = useMemo<AssistantContextValue>(() => ({ focus, setFocus }), [focus]);
  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

/** Reads the current focus. Safe outside the provider (returns an empty focus). */
export function useAssistantContext(): AssistantContextValue {
  return (
    useContext(AssistantContext) ?? {
      focus: {},
      setFocus: () => {},
    }
  );
}

/**
 * Publishes what this screen shows while it is mounted, and clears it on unmount.
 */
export function useAssistantFocus(focus: AssistantFocus): void {
  const { setFocus } = useAssistantContext();
  const missionId = focus.missionId ?? null;
  const teamId = focus.teamId ?? null;
  const proposalId = focus.proposalId ?? null;
  const label = focus.label ?? null;

  useEffect(() => {
    setFocus({ missionId, teamId, proposalId, label });
    return () => setFocus({});
  }, [setFocus, missionId, teamId, proposalId, label]);
}
