-- Leadership check reused by proposal policies and guards.
CREATE OR REPLACE FUNCTION public.is_team_leader(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = _team_id AND t.created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members m
    WHERE m.team_id = _team_id AND m.user_id = _user_id AND m.is_leader
  );
$$;

CREATE TABLE public.solution_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_understanding text NOT NULL DEFAULT '',
  proposed_solution text NOT NULL DEFAULT '',
  technologies text[] NOT NULL DEFAULT '{}',
  expected_impact text NOT NULL DEFAULT '',
  implementation_plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_timeline text NOT NULL DEFAULT '',
  resources_required text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  CONSTRAINT solution_proposals_one_per_team UNIQUE (team_id),
  CONSTRAINT solution_proposals_status_check CHECK (
    status IN ('DRAFT','SUBMITTED','UNDER_AI_REVIEW','AI_REVIEW_COMPLETE','AI_REVIEW_FAILED')
  )
);

CREATE INDEX solution_proposals_mission_idx ON public.solution_proposals(mission_id);

GRANT SELECT, INSERT, UPDATE ON public.solution_proposals TO authenticated;
GRANT ALL ON public.solution_proposals TO service_role;

ALTER TABLE public.solution_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team participants can view their proposal"
ON public.solution_proposals FOR SELECT TO authenticated
USING (public.is_team_member(team_id, auth.uid()) OR public.is_team_owner(team_id, auth.uid()));

CREATE POLICY "Team participants can create their proposal"
ON public.solution_proposals FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (public.is_team_member(team_id, auth.uid()) OR public.is_team_owner(team_id, auth.uid()))
);

CREATE POLICY "Team participants can update their proposal"
ON public.solution_proposals FOR UPDATE TO authenticated
USING (public.is_team_member(team_id, auth.uid()) OR public.is_team_owner(team_id, auth.uid()))
WITH CHECK (public.is_team_member(team_id, auth.uid()) OR public.is_team_owner(team_id, auth.uid()));

-- Content immutability after submission plus leader-only submission.
CREATE OR REPLACE FUNCTION public.guard_proposal_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status <> 'DRAFT' AND (
       NEW.problem_understanding IS DISTINCT FROM OLD.problem_understanding
    OR NEW.proposed_solution IS DISTINCT FROM OLD.proposed_solution
    OR NEW.technologies IS DISTINCT FROM OLD.technologies
    OR NEW.expected_impact IS DISTINCT FROM OLD.expected_impact
    OR NEW.implementation_plan IS DISTINCT FROM OLD.implementation_plan
    OR NEW.estimated_timeline IS DISTINCT FROM OLD.estimated_timeline
    OR NEW.resources_required IS DISTINCT FROM OLD.resources_required
  ) THEN
    RAISE EXCEPTION 'a submitted proposal can no longer be edited';
  END IF;

  IF NEW.status = 'SUBMITTED' AND OLD.status = 'DRAFT'
     AND auth.uid() IS NOT NULL
     AND NOT public.is_team_leader(OLD.team_id, auth.uid()) THEN
    RAISE EXCEPTION 'only the team leader can submit this proposal';
  END IF;

  NEW.created_by = OLD.created_by;
  NEW.team_id = OLD.team_id;
  NEW.mission_id = OLD.mission_id;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER solution_proposals_guard_update
BEFORE UPDATE ON public.solution_proposals
FOR EACH ROW EXECUTE FUNCTION public.guard_proposal_update();

-- Mission status stays under database control, as with team formation.
CREATE OR REPLACE FUNCTION public.sync_mission_proposal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target text;
  note text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'DRAFT' THEN
    target := 'PROPOSAL_DRAFT';
    note := 'A university team started drafting a solution proposal.';
  ELSIF NEW.status = 'SUBMITTED' THEN
    target := 'PROPOSAL_SUBMITTED';
    note := 'A university team submitted a solution proposal.';
  ELSIF NEW.status = 'UNDER_AI_REVIEW' THEN
    target := 'AI_REVIEW';
    note := 'CivicX AI feasibility review of the solution proposal started.';
  ELSIF NEW.status = 'AI_REVIEW_COMPLETE' THEN
    target := 'AI_REVIEW_COMPLETE';
    note := 'CivicX AI feasibility review of the solution proposal completed.';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE public.challenges
  SET status = target
  WHERE id = NEW.mission_id
    AND status IN ('REPORTED','AI_ANALYSIS','AI_ANALYSIS_FAILED','AI_ANALYSIS_COMPLETE',
                   'AI ANALYSIS','TEAM_FORMING','TEAM_FORMED','PROPOSAL_DRAFT',
                   'PROPOSAL_SUBMITTED','AI_REVIEW','AI_REVIEW_COMPLETE');

  INSERT INTO public.challenge_status_history (challenge_id, status, message)
  VALUES (NEW.mission_id, target, note);

  RETURN NEW;
END;
$$;

CREATE TRIGGER solution_proposals_sync_mission_insert
AFTER INSERT ON public.solution_proposals
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_proposal_status();

CREATE TRIGGER solution_proposals_sync_mission_update
AFTER UPDATE OF status ON public.solution_proposals
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_proposal_status();

CREATE TABLE public.proposal_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.solution_proposals(id) ON DELETE CASCADE,
  technical_feasibility text NOT NULL,
  impact_potential text NOT NULL,
  implementation_complexity text NOT NULL,
  skill_alignment text NOT NULL,
  assessment text NOT NULL,
  strengths text[] NOT NULL DEFAULT '{}',
  risks text[] NOT NULL DEFAULT '{}',
  recommendations text[] NOT NULL DEFAULT '{}',
  next_step text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX proposal_reviews_proposal_idx ON public.proposal_reviews(proposal_id);

GRANT SELECT, INSERT ON public.proposal_reviews TO authenticated;
GRANT ALL ON public.proposal_reviews TO service_role;

ALTER TABLE public.proposal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team participants can view their proposal review"
ON public.proposal_reviews FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.solution_proposals p
  WHERE p.id = proposal_reviews.proposal_id
    AND (public.is_team_member(p.team_id, auth.uid()) OR public.is_team_owner(p.team_id, auth.uid()))
));

CREATE POLICY "Team participants can store their proposal review"
ON public.proposal_reviews FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.solution_proposals p
  WHERE p.id = proposal_reviews.proposal_id
    AND (public.is_team_member(p.team_id, auth.uid()) OR public.is_team_owner(p.team_id, auth.uid()))
));