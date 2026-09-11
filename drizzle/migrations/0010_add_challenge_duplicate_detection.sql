-- Additive duplicate-detection layer. No existing report is deleted or merged:
-- every citizen challenge row stays intact, and relationships are recorded
-- separately in public.challenge_duplicates.

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS canonical_challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS challenges_canonical_idx ON public.challenges (canonical_challenge_id);
CREATE INDEX IF NOT EXISTS challenges_geo_idx ON public.challenges (latitude, longitude);

-- Advisory relationship between an existing (canonical) challenge and a newer
-- report that may describe the same underlying civic problem.
CREATE TABLE IF NOT EXISTS public.challenge_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  possible_duplicate_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  similarity_score numeric NOT NULL DEFAULT 0,
  ai_classification text NOT NULL DEFAULT 'POSSIBLE_DUPLICATE'
    CHECK (ai_classification IN ('SAME_ISSUE','POSSIBLE_DUPLICATE','DIFFERENT_ISSUE')),
  ai_confidence numeric,
  ai_reason text,
  ai_recommended_action text,
  distance_m double precision,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','LINKED','DISMISSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_duplicates_distinct CHECK (challenge_id <> possible_duplicate_id),
  CONSTRAINT challenge_duplicates_unique_pair UNIQUE (challenge_id, possible_duplicate_id)
);

CREATE INDEX IF NOT EXISTS challenge_duplicates_challenge_idx
  ON public.challenge_duplicates (challenge_id);
CREATE INDEX IF NOT EXISTS challenge_duplicates_possible_idx
  ON public.challenge_duplicates (possible_duplicate_id);

GRANT SELECT, INSERT, UPDATE ON public.challenge_duplicates TO authenticated;
GRANT ALL ON public.challenge_duplicates TO service_role;
ALTER TABLE public.challenge_duplicates ENABLE ROW LEVEL SECURITY;

-- Owner of either side may read the relationship; universities and government
-- already have read-only discovery access to challenges themselves.
CREATE POLICY "Reporters can view their duplicate links"
ON public.challenge_duplicates FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.challenges c
          WHERE c.id = challenge_duplicates.possible_duplicate_id AND c.created_by = auth.uid())
  OR EXISTS (SELECT 1 FROM public.challenges c
             WHERE c.id = challenge_duplicates.challenge_id AND c.created_by = auth.uid())
  OR public.has_civic_role(auth.uid(), 'university')
  OR public.has_civic_role(auth.uid(), 'government')
);

-- A reporter may only record or review a relationship for the report they filed.
CREATE POLICY "Reporters can record duplicate links for their report"
ON public.challenge_duplicates FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.challenges c
          WHERE c.id = challenge_duplicates.possible_duplicate_id AND c.created_by = auth.uid())
);

CREATE POLICY "Reporters can review duplicate links for their report"
ON public.challenge_duplicates FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.challenges c
          WHERE c.id = challenge_duplicates.possible_duplicate_id AND c.created_by = auth.uid())
  OR public.has_civic_role(auth.uid(), 'government')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.challenges c
          WHERE c.id = challenge_duplicates.possible_duplicate_id AND c.created_by = auth.uid())
  OR public.has_civic_role(auth.uid(), 'government')
);

-- Non-private candidate lookup. Returns only civic fields that university and
-- government roles may already read; never the reporter identity or evidence.
CREATE OR REPLACE FUNCTION public.find_duplicate_candidates(
  _challenge_id uuid,
  _radius_m double precision DEFAULT 3000,
  _limit integer DEFAULT 12
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  priority text,
  status text,
  location_name text,
  city text,
  locality text,
  latitude double precision,
  longitude double precision,
  ai_summary text,
  report_count integer,
  created_at timestamptz,
  distance_m double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT c.id, c.latitude, c.longitude, c.created_at
    FROM public.challenges c
    WHERE c.id = _challenge_id AND c.created_by = auth.uid()
  )
  SELECT c.id, c.title, c.description, c.category, c.priority, c.status,
         c.location_name, c.city, c.locality, c.latitude, c.longitude,
         c.ai_summary, c.report_count, c.created_at,
         CASE
           WHEN me.latitude IS NULL OR me.longitude IS NULL
             OR c.latitude IS NULL OR c.longitude IS NULL THEN NULL
           ELSE 6371000 * 2 * asin(sqrt(
             power(sin(radians(c.latitude - me.latitude) / 2), 2)
             + cos(radians(me.latitude)) * cos(radians(c.latitude))
               * power(sin(radians(c.longitude - me.longitude) / 2), 2)
           ))
         END AS distance_m
  FROM public.challenges c
  CROSS JOIN me
  WHERE c.id <> me.id
    AND c.canonical_challenge_id IS NULL
    AND c.status NOT IN ('IMPACT','RESOLVED')
    AND c.created_at <= me.created_at
    AND (
      me.latitude IS NULL OR me.longitude IS NULL
      OR c.latitude IS NULL OR c.longitude IS NULL
      OR (
        6371000 * 2 * asin(sqrt(
          power(sin(radians(c.latitude - me.latitude) / 2), 2)
          + cos(radians(me.latitude)) * cos(radians(c.latitude))
            * power(sin(radians(c.longitude - me.longitude) / 2), 2)
        )) <= _radius_m
      )
    )
  ORDER BY c.created_at DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.find_duplicate_candidates(uuid, double precision, integer) TO authenticated;

-- Applies the reporter's decision. Both reports are always preserved.
CREATE OR REPLACE FUNCTION public.set_duplicate_link(
  _duplicate_id uuid,
  _linked boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rel public.challenge_duplicates;
  canonical uuid;
BEGIN
  SELECT * INTO rel FROM public.challenge_duplicates WHERE id = _duplicate_id;
  IF rel.id IS NULL THEN
    RAISE EXCEPTION 'relationship not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = rel.possible_duplicate_id AND c.created_by = auth.uid()
  ) AND NOT public.has_civic_role(auth.uid(), 'government') THEN
    RAISE EXCEPTION 'not authorised to review this relationship';
  END IF;

  -- never build a chain: always resolve to the top-level canonical challenge
  SELECT COALESCE(c.canonical_challenge_id, c.id) INTO canonical
  FROM public.challenges c WHERE c.id = rel.challenge_id;

  IF _linked THEN
    UPDATE public.challenge_duplicates SET status = 'LINKED' WHERE id = rel.id;
    UPDATE public.challenges SET canonical_challenge_id = canonical
    WHERE id = rel.possible_duplicate_id;
  ELSE
    UPDATE public.challenge_duplicates SET status = 'DISMISSED' WHERE id = rel.id;
    UPDATE public.challenges SET canonical_challenge_id = NULL
    WHERE id = rel.possible_duplicate_id AND canonical_challenge_id = canonical;
  END IF;

  UPDATE public.challenges c
  SET report_count = 1 + (
    SELECT count(*) FROM public.challenges d WHERE d.canonical_challenge_id = c.id
  )
  WHERE c.id = canonical;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_duplicate_link(uuid, boolean) TO authenticated;

-- Canonical roll-up a citizen may read for a linked challenge they do not own.
CREATE OR REPLACE FUNCTION public.get_canonical_challenge(_challenge_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
  priority text,
  status text,
  location_name text,
  city text,
  latitude double precision,
  longitude double precision,
  ai_summary text,
  recommended_skills text[],
  report_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.title, c.category, c.priority, c.status, c.location_name, c.city,
         c.latitude, c.longitude, c.ai_summary, c.recommended_skills,
         c.report_count, c.created_at
  FROM public.challenges c
  WHERE c.id = _challenge_id
    AND (
      c.created_by = auth.uid()
      OR public.has_civic_role(auth.uid(), 'university')
      OR public.has_civic_role(auth.uid(), 'government')
      OR EXISTS (
        SELECT 1 FROM public.challenge_duplicates d
        JOIN public.challenges mine ON mine.id = d.possible_duplicate_id
        WHERE d.challenge_id = c.id AND mine.created_by = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_canonical_challenge(uuid) TO authenticated;
