-- Make get_next_class_id choose next class by numeric value, independent of ordinal suffix
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
  next_class_id UUID;
BEGIN
  SELECT name, section INTO current_name, current_section
  FROM public.classes 
  WHERE id = current_class_id;

  IF current_name IS NULL THEN
    RETURN current_class_id;
  END IF;

  -- Extract numeric level from current class name
  current_number := NULLIF(substring(current_name FROM '([0-9]+)'), '')::INT;
  IF current_number IS NULL THEN
    RETURN current_class_id;
  END IF;

  next_number := current_number + 1;

  -- Find class whose name contains the next number, ignoring ordinal suffix/prefix wording
  SELECT id INTO next_class_id
  FROM public.classes
  WHERE COALESCE(NULLIF(substring(name FROM '([0-9]+)'), ''), '0')::INT = next_number
    AND COALESCE(section, '') = COALESCE(current_section, '')
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN COALESCE(next_class_id, current_class_id);
END;
$function$;