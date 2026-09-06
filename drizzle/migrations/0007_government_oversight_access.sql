-- Government oversight: narrowly scoped READ-ONLY access plus two profile fields.
-- No existing policy is changed or weakened; government gets SELECT only.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS jurisdiction text;

-- Oversight of the civic pipeline (read-only)
CREATE POLICY "Government can oversee challenges"
ON public.challenges FOR SELECT TO authenticated
USING (public.has_civic_role(auth.uid(), 'government'));

CREATE POLICY "Government can view challenge status history"
ON public.challenge_status_history FOR SELECT TO authenticated
USING (public.has_civic_role(auth.uid(), 'government'));

CREATE POLICY "Government can view teams"
ON public.teams FOR SELECT TO authenticated
USING (public.has_civic_role(auth.uid(), 'government'));

CREATE POLICY "Government can view team members"
ON public.team_members FOR SELECT TO authenticated
USING (public.has_civic_role(auth.uid(), 'government'));

CREATE POLICY "Government can view submitted proposals"
ON public.solution_proposals FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'government')
  AND status <> 'DRAFT'
);

CREATE POLICY "Government can view proposal reviews"
ON public.proposal_reviews FOR SELECT TO authenticated
USING (public.has_civic_role(auth.uid(), 'government'));

CREATE POLICY "Government can view industry collaborations"
ON public.industry_collaborations FOR SELECT TO authenticated
USING (public.has_civic_role(auth.uid(), 'government'));

-- Organisation profiles only (universities + industry). Citizen profiles stay private.
CREATE POLICY "Government can view participating organisations"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_civic_role(auth.uid(), 'government')
  AND role IN ('university', 'industry')
);

-- Live oversight feed. RLS still filters every realtime payload.
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solution_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.industry_collaborations;