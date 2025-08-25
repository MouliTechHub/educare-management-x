-- Fix security issues from previous migration

-- Enable RLS on new tables
ALTER TABLE public.student_enrollments_hist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_enrollments_hist
CREATE POLICY "Admins can manage enrollment history" 
ON public.student_enrollments_hist 
FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Staff can view enrollment history" 
ON public.student_enrollments_hist 
FOR SELECT 
TO authenticated 
USING (
  is_admin() OR 
  has_role('teacher'::app_role) OR 
  has_role('accountant'::app_role)
);

-- RLS policies for fee_ledger  
CREATE POLICY "Finance managers can manage ledger" 
ON public.fee_ledger 
FOR ALL 
TO authenticated 
USING (can_manage_finances())
WITH CHECK (can_manage_finances());

CREATE POLICY "Parents can view own student ledger" 
ON public.fee_ledger 
FOR SELECT 
TO authenticated 
USING (
  can_manage_finances() OR 
  (has_role('parent'::app_role) AND EXISTS (
    SELECT 1 
    FROM student_parent_links spl
    JOIN parents p ON spl.parent_id = p.id
    JOIN profiles pr ON pr.id = auth.uid()
    WHERE spl.student_id = fee_ledger.student_id 
    AND (p.email = pr.email OR p.phone_number = pr.email)
  ))
);

-- Fix function search path
DROP FUNCTION IF EXISTS public.enrollment_upsert(uuid, uuid, uuid, text, uuid);
CREATE OR REPLACE FUNCTION public.enrollment_upsert(
  p_student uuid, 
  p_year uuid, 
  p_class uuid, 
  p_status text, 
  p_actor uuid DEFAULT NULL
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  -- Close any current row
  UPDATE public.student_enrollments_hist
     SET valid_to = now()
   WHERE student_id = p_student 
     AND academic_year_id = p_year 
     AND valid_to IS NULL;

  -- Open new row
  INSERT INTO public.student_enrollments_hist(
    student_id, academic_year_id, class_id, status, created_by
  )
  VALUES (p_student, p_year, p_class, p_status, p_actor);
END $$;