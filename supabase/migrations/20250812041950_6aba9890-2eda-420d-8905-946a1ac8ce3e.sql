-- Refine get_next_class_id: avoid SRF usage in COALESCE by using regex substring
CREATE OR REPLACE FUNCTION public.get_next_class_id(current_class_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_name TEXT;
  current_section TEXT;
  current_number INT;
  next_number INT;
  next_name TEXT;
  next_class_id UUID;
BEGIN
  SELECT name, section INTO current_name, current_section
  FROM public.classes 
  WHERE id = current_class_id;

  IF current_name IS NULL THEN
    RETURN current_class_id;
  END IF;

  -- Extract the first number sequence from the class name safely (e.g., '1st Class' -> 1)
  current_number := NULLIF(substring(current_name FROM '([0-9]+)'), '')::INT;

  IF current_number IS NULL THEN
    RETURN current_class_id;
  END IF;

  next_number := current_number + 1;

  -- Replace only the first number sequence with the incremented value
  next_name := regexp_replace(current_name, '([0-9]+)', next_number::TEXT);

  SELECT id INTO next_class_id
  FROM public.classes
  WHERE name = next_name 
    AND COALESCE(section, '') = COALESCE(current_section, '')
  LIMIT 1;

  RETURN COALESCE(next_class_id, current_class_id);
END;
$function$;