-- Fix security definer view issues by dropping and recreating as regular views
-- The views don't need SECURITY DEFINER since they're just data aggregations

DROP VIEW IF EXISTS public.v_pyd_per_student;
DROP VIEW IF EXISTS public.v_pyd;
DROP VIEW IF EXISTS public.v_fee_outstanding;

-- Create regular views without SECURITY DEFINER
CREATE VIEW public.v_fee_outstanding AS
SELECT
  id, 
  academic_year_id, 
  student_id, 
  class_id, 
  fee_type,
  GREATEST(
    COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
    0
  )::NUMERIC(12,2) AS outstanding
FROM public.student_fee_records;

CREATE VIEW public.v_pyd AS
SELECT 
  academic_year_id, 
  student_id, 
  class_id, 
  outstanding
FROM public.v_fee_outstanding
WHERE fee_type = 'Previous Year Dues';

CREATE VIEW public.v_pyd_per_student AS
SELECT 
  academic_year_id,
  student_id,
  SUM(outstanding)::NUMERIC(12,2) AS pyd_per_student
FROM public.v_pyd
GROUP BY academic_year_id, student_id;