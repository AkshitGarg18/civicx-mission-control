-- Institution-level capability profile for university accounts.
-- Additive and fully nullable: existing profiles, RLS policies and the
-- student skill matching system are untouched.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS academic_disciplines text[],
  ADD COLUMN IF NOT EXISTS research_areas text[],
  ADD COLUMN IF NOT EXISTS faculty_expertise text[],
  ADD COLUMN IF NOT EXISTS lab_capabilities text[],
  ADD COLUMN IF NOT EXISTS innovation_facilities text[],
  ADD COLUMN IF NOT EXISTS tech_capabilities text[],
  ADD COLUMN IF NOT EXISTS civic_domains text[],
  ADD COLUMN IF NOT EXISTS district text;

COMMENT ON COLUMN public.profiles.academic_disciplines IS 'Institution-level academic disciplines (university profiles).';
COMMENT ON COLUMN public.profiles.civic_domains IS 'Civic domains the institution supports (university profiles).';
