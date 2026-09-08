-- Emergency response layer: advisory AI threat assessment stored alongside the
-- existing civic analysis. No RLS change: the new columns live on challenges and
-- inherit the existing role-based policies.

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS threat_level text NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS threat_category text,
  ADD COLUMN IF NOT EXISTS threat_reason text,
  ADD COLUMN IF NOT EXISTS recommended_service text,
  ADD COLUMN IF NOT EXISTS emergency_status text NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_threat_level_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_threat_level_check
  CHECK (threat_level IN ('NORMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_emergency_status_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_emergency_status_check
  CHECK (emergency_status IN (
    'NORMAL',
    'HIGH_PRIORITY',
    'POTENTIAL_EMERGENCY',
    'EMERGENCY_ESCALATION_INITIATED',
    'RESOLVED'
  ));

CREATE INDEX IF NOT EXISTS challenges_emergency_status_idx
  ON public.challenges (emergency_status);
