-- Fix security issues: Add RLS policies for views and secure function
DROP VIEW IF EXISTS public.v_pyd CASCADE;
DROP VIEW IF EXISTS public.v_pyd_per_student CASCADE;
DROP FUNCTION IF EXISTS public.get_pyd_summary(UUID);

-- 1) Per-row outstanding for PYD with RLS
CREATE VIEW public.v_pyd AS
SELECT
  academic_year_id,
  student_id,
  class_id,
  GREATEST(
    COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
    0
  )::NUMERIC(12,2) AS pyd_outstanding
FROM public.student_fee_records
WHERE fee_type = 'Previous Year Dues';

ALTER VIEW public.v_pyd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance managers can view PYD details" ON public.v_pyd
FOR SELECT USING (can_manage_finances());

-- 2) Per-student PYD in a year with RLS
CREATE VIEW public.v_pyd_per_student AS
SELECT 
  academic_year_id, 
  student_id,
  SUM(pyd_outstanding)::NUMERIC(12,2) AS pyd_per_student
FROM public.v_pyd
GROUP BY academic_year_id, student_id;

ALTER VIEW public.v_pyd_per_student ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance managers can view PYD per student" ON public.v_pyd_per_student
FOR SELECT USING (can_manage_finances());

-- 3) Summary RPC with proper security
CREATE OR REPLACE FUNCTION public.get_pyd_summary(p_year UUID)
RETURNS TABLE(
  students_with_dues INT,
  total_outstanding  NUMERIC,
  avg_per_student    NUMERIC,
  high_count         INT,
  medium_count       INT,
  low_count          INT
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
WITH s AS (
  SELECT pyd_per_student
  FROM public.v_pyd_per_student
  WHERE academic_year_id = p_year
),
t AS (
  SELECT
    COUNT(*)                                         AS students_with_dues,
    COALESCE(SUM(pyd_per_student),0)::NUMERIC(12,2)  AS total_outstanding,
    COALESCE(SUM(pyd_per_student),0) / NULLIF(COUNT(*),0) AS avg_per_student
  FROM s
),
b AS (
  SELECT
    SUM(CASE WHEN pyd_per_student >= 25000 THEN 1 ELSE 0 END) AS high_count,
    SUM(CASE WHEN pyd_per_student >= 10000 AND pyd_per_student < 25000 THEN 1 ELSE 0 END) AS medium_count,
    SUM(CASE WHEN pyd_per_student > 0 AND pyd_per_student < 10000 THEN 1 ELSE 0 END) AS low_count
  FROM s
)
SELECT t.students_with_dues, t.total_outstanding, t.avg_per_student, b.high_count, b.medium_count, b.low_count
FROM t CROSS JOIN b;
$$;