-- First, update existing status values to match new constraint
UPDATE public.students 
SET status = 'Active' 
WHERE status NOT IN ('Active', 'Inactive', 'Alumni', 'Transferred', 'Withdrawn');

-- Add new columns for exit information
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS exit_reason TEXT,
ADD COLUMN IF NOT EXISTS exit_date DATE,
ADD COLUMN IF NOT EXISTS feedback_notes TEXT;

-- Now apply the constraint
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE public.students 
ADD CONSTRAINT students_status_check 
CHECK (status IN ('Active', 'Inactive', 'Alumni', 'Transferred', 'Withdrawn'));

-- Update the student status function to handle new fields
CREATE OR REPLACE FUNCTION public.set_student_status(
  p_student_id UUID,
  p_new_status TEXT,
  p_exit_reason TEXT DEFAULT NULL,
  p_feedback_notes TEXT DEFAULT NULL,
  p_exit_date DATE DEFAULT NULL,
  p_anonymize BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  old_status TEXT;
BEGIN
  -- Permission check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;

  -- Validate status
  IF p_new_status NOT IN ('Active', 'Inactive', 'Alumni', 'Transferred', 'Withdrawn') THEN
    RAISE EXCEPTION 'invalid_status: must be Active, Inactive, Alumni, Transferred, or Withdrawn';
  END IF;

  -- Get current status
  SELECT status INTO old_status FROM public.students WHERE id = p_student_id;
  
  IF old_status IS NULL THEN
    RAISE EXCEPTION 'student_not_found';
  END IF;

  -- Update student status and exit information
  UPDATE public.students
  SET 
    status = p_new_status,
    exit_reason = CASE WHEN p_new_status != 'Active' THEN p_exit_reason ELSE NULL END,
    exit_date = CASE WHEN p_new_status != 'Active' THEN COALESCE(p_exit_date, CURRENT_DATE) ELSE NULL END,
    feedback_notes = CASE WHEN p_new_status != 'Active' THEN p_feedback_notes ELSE NULL END,
    updated_at = now()
  WHERE id = p_student_id;

  -- Log the status change in audit table
  INSERT INTO public.student_status_audit (
    student_id,
    old_status,
    new_status,
    exit_reason,
    exit_date,
    exit_feedback,
    anonymized,
    actor
  ) VALUES (
    p_student_id,
    old_status,
    p_new_status,
    p_exit_reason,
    CASE WHEN p_new_status != 'Active' THEN COALESCE(p_exit_date, CURRENT_DATE) ELSE NULL END,
    p_feedback_notes,
    p_anonymize,
    auth.uid()
  );
END;
$$;

-- Function to reactivate a student
CREATE OR REPLACE FUNCTION public.reactivate_student(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Permission check
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;

  -- Reactivate the student by calling set_student_status
  PERFORM public.set_student_status(p_student_id, 'Active', NULL, NULL, NULL, false);
END;
$$;