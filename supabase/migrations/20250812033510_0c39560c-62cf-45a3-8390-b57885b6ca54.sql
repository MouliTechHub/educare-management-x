-- Resolve ambiguous RPC by removing legacy 3-arg variant
DROP FUNCTION IF EXISTS public.promote_students_with_fees(jsonb, uuid, text);