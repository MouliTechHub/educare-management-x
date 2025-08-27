-- 1) Status domain
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
    CREATE TYPE public.student_status AS ENUM ('Active','Inactive','Alumni','Transferred','Withdrawn');
  END IF;
END $$;

-- 2) Extend students with lifecycle fields (if missing)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS exit_reason text,
  ADD COLUMN IF NOT EXISTS exit_feedback text,
  ADD COLUMN IF NOT EXISTS exit_date date,
  ADD COLUMN IF NOT EXISTS inactive_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS anonymized bool DEFAULT false;

-- 3) Handle status column type conversion by dropping ALL dependent views first
DO $$
BEGIN
  -- Check if status column exists and is not the enum type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    -- Drop all dependent views temporarily
    DROP VIEW IF EXISTS public.class_gender_stats CASCADE;
    DROP VIEW IF EXISTS public.v_students_with_fees CASCADE;
    DROP VIEW IF EXISTS public.v_active_students CASCADE;
    DROP VIEW IF EXISTS public.v_archived_students CASCADE;
    
    -- Drop the default constraint first
    ALTER TABLE public.students ALTER COLUMN status DROP DEFAULT;
    -- Convert existing text status to enum
    ALTER TABLE public.students 
    ALTER COLUMN status TYPE public.student_status USING status::public.student_status;
    -- Add back the default
    ALTER TABLE public.students ALTER COLUMN status SET DEFAULT 'Active';
    
    -- Recreate essential views
    CREATE VIEW public.class_gender_stats AS
    SELECT 
      c.id,
      c.name,
      c.section,
      COUNT(s.id) as total_students,
      COUNT(CASE WHEN s.gender = 'Male' THEN 1 END) as male_count,
      COUNT(CASE WHEN s.gender = 'Female' THEN 1 END) as female_count,
      COUNT(CASE WHEN s.gender NOT IN ('Male', 'Female') THEN 1 END) as other_count
    FROM public.classes c
    LEFT JOIN public.students s ON c.id = s.class_id AND s.status = 'Active'
    GROUP BY c.id, c.name, c.section;
  END IF;
END $$;

-- 4) Audit table for status changes
CREATE TABLE IF NOT EXISTS public.student_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  old_status public.student_status,
  new_status public.student_status NOT NULL,
  exit_reason text,
  exit_feedback text,
  exit_date date,
  anonymized bool DEFAULT false,
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for status audit table
ALTER TABLE public.student_status_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view status audit" ON public.student_status_audit
  FOR SELECT USING (is_admin());

CREATE POLICY "System can insert status audit" ON public.student_status_audit
  FOR INSERT WITH CHECK (true);

-- 5) Views for different student states
CREATE OR REPLACE VIEW public.v_active_students AS
SELECT * FROM public.students WHERE status = 'Active';

CREATE OR REPLACE VIEW public.v_inactive_students AS
SELECT
  id,
  first_name,
  last_name,
  admission_number,
  gender,
  class_id,
  status,
  exit_reason,
  exit_feedback,
  exit_date,
  inactive_at,
  reactivated_at,
  anonymized,
  created_at,
  updated_at,
  -- Join with class info
  (SELECT name FROM public.classes WHERE id = students.class_id) as class_name,
  (SELECT section FROM public.classes WHERE id = students.class_id) as section
FROM public.students
WHERE status IN ('Inactive', 'Alumni', 'Transferred', 'Withdrawn');

CREATE OR REPLACE VIEW public.v_student_status_summary AS
SELECT status, count(*) as total
FROM public.students
GROUP BY status;

-- 6) RPC functions for status management
CREATE OR REPLACE FUNCTION public.set_student_status(
  p_student_id uuid,
  p_new_status public.student_status,
  p_exit_reason text DEFAULT NULL,
  p_exit_feedback text DEFAULT NULL,
  p_exit_date date DEFAULT NULL,
  p_anonymize bool DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old public.student_status;
BEGIN
  -- Permission check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;
  
  SELECT status INTO v_old FROM public.students WHERE id = p_student_id FOR UPDATE;

  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Student % not found', p_student_id;
  END IF;

  UPDATE public.students
  SET status = p_new_status,
      exit_reason = CASE WHEN p_new_status IN ('Inactive','Alumni','Transferred','Withdrawn') THEN p_exit_reason ELSE NULL END,
      exit_feedback = CASE WHEN p_new_status IN ('Inactive','Alumni','Transferred','Withdrawn') THEN p_exit_feedback ELSE NULL END,
      exit_date = CASE WHEN p_new_status IN ('Inactive','Alumni','Transferred','Withdrawn') THEN COALESCE(p_exit_date, CURRENT_DATE) ELSE NULL END,
      inactive_at = CASE WHEN p_new_status IN ('Inactive','Alumni','Transferred','Withdrawn') THEN COALESCE(inactive_at, now()) ELSE NULL END,
      reactivated_at = CASE WHEN p_new_status = 'Active' THEN now() ELSE reactivated_at END,
      anonymized = COALESCE(p_anonymize, false),
      -- Only anonymize if explicitly requested
      first_name = CASE WHEN COALESCE(p_anonymize, false) THEN 'Former' ELSE first_name END,
      last_name = CASE WHEN COALESCE(p_anonymize, false) THEN CONCAT('Student ', substr(id::text, 1, 8)) ELSE last_name END,
      updated_at = now()
  WHERE id = p_student_id;

  -- Log the status change
  INSERT INTO public.student_status_audit(
    student_id, old_status, new_status, exit_reason, exit_feedback, exit_date, anonymized, actor
  ) VALUES (
    p_student_id, v_old, p_new_status, p_exit_reason, p_exit_feedback, p_exit_date, COALESCE(p_anonymize, false), auth.uid()
  );
END $$;

-- Convenience function for setting inactive
CREATE OR REPLACE FUNCTION public.set_student_inactive(
  p_student_id uuid,
  p_exit_reason text,
  p_exit_feedback text DEFAULT NULL,
  p_exit_date date DEFAULT NULL,
  p_anonymize bool DEFAULT false
) RETURNS void
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT public.set_student_status(p_student_id, 'Inactive', p_exit_reason, p_exit_feedback, p_exit_date, p_anonymize);
$$;

-- Convenience function for reactivation
CREATE OR REPLACE FUNCTION public.reactivate_student(p_student_id uuid)
RETURNS void 
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT public.set_student_status(p_student_id, 'Active', NULL, NULL, NULL, false);
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_student_status(uuid, public.student_status, text, text, date, bool) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_student_inactive(uuid, text, text, date, bool) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_student(uuid) TO authenticated;