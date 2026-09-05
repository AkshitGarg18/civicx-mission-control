-- 1. Student/university profile fields (all optional, additive)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Universities may discover other university profiles only (never citizens)
CREATE POLICY "Universities can discover university profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_civic_role(auth.uid(), 'university') AND role = 'university');

-- 2. Teams
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  status text NOT NULL DEFAULT 'TEAM_FORMING',
  skill_coverage integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_leader boolean NOT NULL DEFAULT false,
  contribution_area text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX teams_mission_id_idx ON public.teams(mission_id);
CREATE INDEX team_members_team_id_idx ON public.team_members(team_id);
CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

-- 3. Membership helpers (security definer, so policies never recurse)
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members m
    WHERE m.team_id = _team_id AND m.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = _team_id AND t.created_by = _user_id
  );
$$;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members and owners can view teams"
ON public.teams FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_team_member(id, auth.uid()));

CREATE POLICY "Universities can create teams"
ON public.teams FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.has_civic_role(auth.uid(), 'university'));

CREATE POLICY "Owners can update their teams"
ON public.teams FOR UPDATE TO authenticated
USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can delete their teams"
ON public.teams FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Team participants can view members"
ON public.team_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_team_owner(team_id, auth.uid())
  OR public.is_team_member(team_id, auth.uid())
);

CREATE POLICY "Team owners can add university members"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (
  public.is_team_owner(team_id, auth.uid())
  AND public.has_civic_role(user_id, 'university')
);

CREATE POLICY "Owners can remove members and members can leave"
ON public.team_members FOR DELETE TO authenticated
USING (public.is_team_owner(team_id, auth.uid()) OR user_id = auth.uid());

CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Mission status advances when a team is created, without granting
--    universities write access to citizen challenge rows.
CREATE OR REPLACE FUNCTION public.sync_mission_team_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.challenges
  SET status = NEW.status
  WHERE id = NEW.mission_id
    AND status IN ('REPORTED','AI_ANALYSIS','AI_ANALYSIS_FAILED','AI_ANALYSIS_COMPLETE','AI ANALYSIS','TEAM_FORMING','TEAM_FORMED');

  INSERT INTO public.challenge_status_history (challenge_id, status, message)
  VALUES (
    NEW.mission_id,
    NEW.status,
    CASE WHEN NEW.status = 'TEAM_FORMED'
      THEN 'A university solution team has been formed for this mission.'
      ELSE 'A university has started forming a solution team for this mission.'
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_sync_mission_status_insert
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_team_status();

CREATE TRIGGER teams_sync_mission_status_update
AFTER UPDATE OF status ON public.teams
FOR EACH ROW WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION public.sync_mission_team_status();