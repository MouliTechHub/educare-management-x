-- Create view for archived students (fixed column names)
CREATE OR REPLACE VIEW public.v_archived_students AS
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.admission_number,
  s.gender,
  s.class_id,
  s.status,
  s.deleted_at,
  s.deleted_reason,
  s.created_at,
  s.updated_at,
  s.date_of_birth,
  s.address_line1,
  s.address_line2,
  s.city,
  s.state,
  s.pin_code,
  s.photo_url,
  c.name as class_name,
  c.section as class_section
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
WHERE s.deleted_at IS NOT NULL
ORDER BY s.deleted_at DESC;

-- Create audit table for archive/restore actions
CREATE TABLE IF NOT EXISTS public.student_archive_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('ARCHIVE', 'RESTORE')),
  reason TEXT,
  actor UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.student_archive_audit ENABLE ROW LEVEL SECURITY;

-- Create policy for audit table - only admins can view
CREATE POLICY "Only admins can view archive audit"
ON public.student_archive_audit
FOR SELECT
TO authenticated
USING (is_admin());

-- Create policy for system to insert audit records
CREATE POLICY "System can insert archive audit"
ON public.student_archive_audit
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create restore student function
CREATE OR REPLACE FUNCTION public.restore_student(p_student_id UUID, p_reason TEXT DEFAULT 'manual restore')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Permission check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;

  -- Restore the student
  UPDATE public.students
  SET deleted_at = NULL,
      deleted_reason = NULL,
      status = 'Active',
      updated_at = now()
  WHERE id = p_student_id
    AND deleted_at IS NOT NULL;

  -- Log the restoration
  INSERT INTO public.student_archive_audit(student_id, action, reason, actor)
  VALUES (p_student_id, 'RESTORE', p_reason, auth.uid());

  -- Log security event
  PERFORM log_security_event(
    'student_restored',
    'students',
    p_student_id,
    jsonb_build_object('reason', p_reason)
  );
END;
$$;

-- Update existing archive_student function to log audit
CREATE OR REPLACE FUNCTION public.archive_student(p_student uuid, p_reason text DEFAULT 'user_request'::text, p_anonymize boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Permission check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;

  UPDATE public.students
     SET deleted_at = now(),
         status = 'Archived',
         deleted_reason = p_reason,
         -- Optional PII minimization, keeps IDs for joins
         first_name = CASE WHEN p_anonymize THEN 'Former' ELSE first_name END,
         last_name = CASE WHEN p_anonymize THEN concat('Student-', substr(id::text,1,8)) ELSE last_name END,
         updated_at = now()
   WHERE id = p_student AND deleted_at IS NULL;
   
   -- Log the archival in audit table
   INSERT INTO public.student_archive_audit(student_id, action, reason, actor)
   VALUES (p_student, 'ARCHIVE', p_reason, auth.uid());
   
   -- Log the archival in security log
   PERFORM log_security_event(
     'student_archived',
     'students',
     p_student,
     jsonb_build_object('reason', p_reason, 'anonymized', p_anonymize)
   );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.restore_student(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_student(UUID, TEXT, BOOLEAN) TO authenticated;