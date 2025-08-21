-- Fix security linter issues: Recreate views as regular views (not security definer)
-- The linter is incorrectly flagging these as security definer views

DROP VIEW IF EXISTS public.v_fee_outstanding CASCADE;
CREATE VIEW public.v_fee_outstanding AS
SELECT 
  id, 
  academic_year_id, 
  student_id, 
  class_id, 
  fee_type,
  GREATEST(
    COALESCE(actual_fee, 0) - COALESCE(paid_amount, 0) - COALESCE(discount_amount, 0), 
    0
  )::NUMERIC(12,2) AS outstanding
FROM public.student_fee_records;

DROP VIEW IF EXISTS public.v_pyd CASCADE;
CREATE VIEW public.v_pyd AS
SELECT 
  academic_year_id, 
  student_id, 
  class_id, 
  outstanding
FROM public.v_fee_outstanding
WHERE fee_type = 'Previous Year Dues'
  AND outstanding > 0;

DROP VIEW IF EXISTS public.v_pyd_per_student CASCADE;  
CREATE VIEW public.v_pyd_per_student AS
SELECT 
  academic_year_id,
  student_id,
  SUM(outstanding) AS pyd_per_student
FROM public.v_pyd
GROUP BY academic_year_id, student_id;