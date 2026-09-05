ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS affected_stakeholders text[],
  ADD COLUMN IF NOT EXISTS solution_directions text[];