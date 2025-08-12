-- Atomic setter for current academic year
CREATE OR REPLACE FUNCTION public.set_current_academic_year(p_year_id uuid)
RETURNS public.academic_years
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_row public.academic_years%ROWTYPE;
BEGIN
  -- Permission check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;

  -- Unset all others and set target as current in one transaction
  UPDATE public.academic_years SET is_current = false WHERE id <> p_year_id;
  UPDATE public.academic_years SET is_current = true, updated_at = now() WHERE id = p_year_id;

  SELECT * INTO updated_row FROM public.academic_years WHERE id = p_year_id;
  RETURN updated_row;
END;
$$;