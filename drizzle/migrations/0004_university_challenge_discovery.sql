-- Security-definer role lookup (avoids recursive RLS on profiles)
CREATE OR REPLACE FUNCTION public.has_civic_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_civic_role(uuid, text) TO authenticated;

-- Keep a profile's role immutable after creation so a user cannot escalate
-- their own access by editing their profile row.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_role_immutable ON public.profiles;
CREATE TRIGGER profiles_role_immutable
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- Universities may discover civic challenges (read-only). Evidence files,
-- status history and profiles stay restricted to their owners.
DROP POLICY IF EXISTS "Universities can discover challenges" ON public.challenges;
CREATE POLICY "Universities can discover challenges"
ON public.challenges
FOR SELECT
TO authenticated
USING (public.has_civic_role(auth.uid(), 'university'));
