-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text,
  email text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen','university','industry','government')),
  institution text,
  skills text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- challenges
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  location_name text,
  latitude double precision,
  longitude double precision,
  priority text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'REPORTED',
  ai_confidence numeric,
  estimated_impact integer,
  ai_summary text,
  recommended_skills text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX challenges_created_by_idx ON public.challenges (created_by);
GRANT SELECT, INSERT, UPDATE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can view their own challenges" ON public.challenges FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Citizens can create their own challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Citizens can update their own challenges" ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER challenges_set_updated_at BEFORE UPDATE ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- evidence
CREATE TABLE public.challenge_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX challenge_evidence_challenge_idx ON public.challenge_evidence (challenge_id);
GRANT SELECT, INSERT, DELETE ON public.challenge_evidence TO authenticated;
GRANT ALL ON public.challenge_evidence TO service_role;
ALTER TABLE public.challenge_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view evidence" ON public.challenge_evidence FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid()));
CREATE POLICY "Owners can add evidence" ON public.challenge_evidence FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid()));
CREATE POLICY "Owners can delete evidence" ON public.challenge_evidence FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid()));

-- status history
CREATE TABLE public.challenge_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX challenge_status_history_challenge_idx ON public.challenge_status_history (challenge_id);
GRANT SELECT, INSERT ON public.challenge_status_history TO authenticated;
GRANT ALL ON public.challenge_status_history TO service_role;
ALTER TABLE public.challenge_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view status history" ON public.challenge_status_history FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid()));
CREATE POLICY "Owners can insert status history" ON public.challenge_status_history FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid()));