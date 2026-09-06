-- Organization fields reused on the existing profiles table (additive, nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_type TEXT,
  ADD COLUMN IF NOT EXISTS industry_domain TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS expertise_areas TEXT[],
  ADD COLUMN IF NOT EXISTS technologies TEXT[],
  ADD COLUMN IF NOT EXISTS support_capabilities TEXT[];

-- A proposal is open to industry review once it is submitted AND the AI review exists.
CREATE OR REPLACE FUNCTION public.is_industry_ready_proposal(_proposal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.solution_proposals p
    JOIN public.proposal_reviews r ON r.proposal_id = p.id
    WHERE p.id = _proposal_id
      AND p.status = 'AI_REVIEW_COMPLETE'
  );
$$;

CREATE OR REPLACE FUNCTION public.challenge_has_industry_ready_proposal(_challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.solution_proposals p
    JOIN public.proposal_reviews r ON r.proposal_id = p.id
    WHERE p.mission_id = _challenge_id
      AND p.status = 'AI_REVIEW_COMPLETE'
  );
$$;

CREATE OR REPLACE FUNCTION public.team_has_industry_ready_proposal(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.solution_proposals p
    JOIN public.proposal_reviews r ON r.proposal_id = p.id
    WHERE p.team_id = _team_id
      AND p.status = 'AI_REVIEW_COMPLETE'
  );
$$;

-- Industry participation layer. References only; no copies of challenge/proposal text.
CREATE TABLE public.industry_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.solution_proposals(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  industry_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  support_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  message TEXT NOT NULL DEFAULT '',
  next_step TEXT,
  status TEXT NOT NULL DEFAULT 'INTEREST_EXPRESSED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT industry_collaborations_status_check CHECK (
    status IN ('INTEREST_EXPRESSED','UNDER_DISCUSSION','ACTIVE','COMPLETED','DECLINED')
  ),
  CONSTRAINT industry_collaborations_unique_interest UNIQUE (proposal_id, industry_user_id)
);

CREATE INDEX industry_collaborations_industry_user_idx ON public.industry_collaborations (industry_user_id);
CREATE INDEX industry_collaborations_proposal_idx ON public.industry_collaborations (proposal_id);
CREATE INDEX industry_collaborations_challenge_idx ON public.industry_collaborations (challenge_id);
CREATE INDEX industry_collaborations_team_idx ON public.industry_collaborations (team_id);
CREATE INDEX industry_collaborations_status_idx ON public.industry_collaborations (status);

GRANT SELECT, INSERT, UPDATE ON public.industry_collaborations TO authenticated;
GRANT ALL ON public.industry_collaborations TO service_role;

ALTER TABLE public.industry_collaborations ENABLE ROW LEVEL SECURITY;

-- Industry organisations may only register interest in their own name, on eligible proposals.
CREATE POLICY "Industry can express interest in eligible proposals"
ON public.industry_collaborations FOR INSERT TO authenticated
WITH CHECK (
  industry_user_id = auth.uid()
  AND public.has_civic_role(auth.uid(), 'industry')
  AND public.is_industry_ready_proposal(proposal_id)
  AND EXISTS (
    SELECT 1 FROM public.solution_proposals p
    WHERE p.id = proposal_id
      AND p.team_id = industry_collaborations.team_id
      AND p.mission_id = industry_collaborations.challenge_id
  )
);

-- Visible to the industry organisation that created it and to the university team it targets.
CREATE POLICY "Participants can view their collaborations"
ON public.industry_collaborations FOR SELECT TO authenticated
USING (
  industry_user_id = auth.uid()
  OR public.is_team_member(team_id, auth.uid())
  OR public.is_team_owner(team_id, auth.uid())
);

CREATE POLICY "Industry can update their own collaborations"
ON public.industry_collaborations FOR UPDATE TO authenticated
USING (industry_user_id = auth.uid())
WITH CHECK (industry_user_id = auth.uid());

CREATE POLICY "Team participants can update collaborations on their proposals"
ON public.industry_collaborations FOR UPDATE TO authenticated
USING (public.is_team_member(team_id, auth.uid()) OR public.is_team_owner(team_id, auth.uid()))
WITH CHECK (public.is_team_member(team_id, auth.uid()) OR public.is_team_owner(team_id, auth.uid()));

-- References are immutable; only the university side may close a collaboration.
CREATE OR REPLACE FUNCTION public.guard_industry_collaboration_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.proposal_id := OLD.proposal_id;
  NEW.challenge_id := OLD.challenge_id;
  NEW.team_id := OLD.team_id;
  NEW.industry_user_id := OLD.industry_user_id;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();

  IF NEW.status = 'COMPLETED' AND OLD.status <> 'COMPLETED'
     AND auth.uid() IS NOT NULL
     AND NOT (public.is_team_member(OLD.team_id, auth.uid()) OR public.is_team_owner(OLD.team_id, auth.uid())) THEN
    RAISE EXCEPTION 'only the university team can mark a collaboration completed';
  END IF;

  IF OLD.status = 'COMPLETED' AND NEW.status <> 'COMPLETED' THEN
    RAISE EXCEPTION 'a completed collaboration can no longer change status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER industry_collaborations_guard_update
BEFORE UPDATE ON public.industry_collaborations
FOR EACH ROW EXECUTE FUNCTION public.guard_industry_collaboration_update();

-- Mission lifecycle continues past the AI review once industry engages.
CREATE OR REPLACE FUNCTION public.sync_mission_industry_status()
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

  IF NEW.status = 'INTEREST_EXPRESSED' THEN
    target := 'INDUSTRY_INTEREST';
    note := 'An industry organisation expressed interest in supporting this solution.';
  ELSIF NEW.status IN ('UNDER_DISCUSSION','ACTIVE') THEN
    target := 'COLLABORATION';
    note := 'Industry collaboration is now under way for this mission.';
  ELSIF NEW.status = 'COMPLETED' THEN
    target := 'IMPACT';
    note := 'The industry collaboration for this mission was completed.';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE public.challenges
  SET status = target
  WHERE id = NEW.challenge_id
    AND status IN ('REPORTED','AI_ANALYSIS','AI_ANALYSIS_FAILED','AI_ANALYSIS_COMPLETE','AI ANALYSIS',
                   'TEAM_FORMING','TEAM_FORMED','PROPOSAL_DRAFT','PROPOSAL_SUBMITTED','AI_REVIEW',
                   'AI_REVIEW_COMPLETE','INDUSTRY_INTEREST','COLLABORATION');

  INSERT INTO public.challenge_status_history (challenge_id, status, message)
  VALUES (NEW.challenge_id, target, note);

  RETURN NEW;
END;
$$;

CREATE TRIGGER industry_collaborations_sync_mission_insert
AFTER INSERT ON public.industry_collaborations
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_industry_status();

CREATE TRIGGER industry_collaborations_sync_mission_update
AFTER UPDATE ON public.industry_collaborations
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_industry_status();

-- Read access industry needs to evaluate an opportunity (eligible records only).
CREATE POLICY "Industry can view industry-ready proposals"
ON public.solution_proposals FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'industry')
  AND status = 'AI_REVIEW_COMPLETE'
  AND public.is_industry_ready_proposal(id)
);

CREATE POLICY "Industry can view reviews of industry-ready proposals"
ON public.proposal_reviews FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'industry')
  AND public.is_industry_ready_proposal(proposal_id)
);

CREATE POLICY "Industry can view teams behind industry-ready proposals"
ON public.teams FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'industry')
  AND public.team_has_industry_ready_proposal(id)
);

CREATE POLICY "Industry can view challenges behind industry-ready proposals"
ON public.challenges FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'industry')
  AND public.challenge_has_industry_ready_proposal(id)
);

-- Names only, both directions: industry sees the owning university profile,
-- university teams see the industry organisation that reached out.
CREATE POLICY "Industry can view universities behind industry-ready proposals"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'industry')
  AND EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.created_by = profiles.id
      AND public.team_has_industry_ready_proposal(t.id)
  )
);

CREATE POLICY "Team participants can view interested industry profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.industry_collaborations c
    WHERE c.industry_user_id = profiles.id
      AND (public.is_team_member(c.team_id, auth.uid()) OR public.is_team_owner(c.team_id, auth.uid()))
  )
);
