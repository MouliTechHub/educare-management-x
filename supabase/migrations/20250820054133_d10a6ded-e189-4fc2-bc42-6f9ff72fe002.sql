-- Fix security approach: Use secure RPC functions instead of views
DROP VIEW IF EXISTS public.v_pyd CASCADE;
DROP VIEW IF EXISTS public.v_pyd_per_student CASCADE;
DROP FUNCTION IF EXISTS public.get_pyd_summary(UUID);

-- Main PYD summary RPC with proper security
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
  -- Check permission
  SELECT CASE WHEN NOT can_manage_finances() THEN
    RAISE(EXCEPTION, 'insufficient_privilege: finance role required')
  END;

  WITH pyd_per_student AS (
    SELECT 
      student_id,
      SUM(GREATEST(
        COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
        0
      )) AS pyd_outstanding
    FROM public.student_fee_records
    WHERE fee_type = 'Previous Year Dues' 
      AND academic_year_id = p_year
    GROUP BY student_id
    HAVING SUM(GREATEST(
      COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
      0
    )) > 0
  ),
  totals AS (
    SELECT
      COUNT(*)::INT AS students_with_dues,
      COALESCE(SUM(pyd_outstanding), 0)::NUMERIC(12,2) AS total_outstanding,
      CASE WHEN COUNT(*) > 0 
        THEN (COALESCE(SUM(pyd_outstanding), 0) / COUNT(*))::NUMERIC(12,2)
        ELSE 0::NUMERIC(12,2)
      END AS avg_per_student
    FROM pyd_per_student
  ),
  buckets AS (
    SELECT
      SUM(CASE WHEN pyd_outstanding >= 25000 THEN 1 ELSE 0 END)::INT AS high_count,
      SUM(CASE WHEN pyd_outstanding >= 10000 AND pyd_outstanding < 25000 THEN 1 ELSE 0 END)::INT AS medium_count,
      SUM(CASE WHEN pyd_outstanding > 0 AND pyd_outstanding < 10000 THEN 1 ELSE 0 END)::INT AS low_count
    FROM pyd_per_student
  )
  SELECT 
    t.students_with_dues, 
    t.total_outstanding, 
    t.avg_per_student, 
    b.high_count, 
    b.medium_count, 
    b.low_count
  FROM totals t CROSS JOIN buckets b;
$$;

-- Helper function to get PYD details for a student in a specific year
CREATE OR REPLACE FUNCTION public.get_student_pyd_details(p_student_id UUID, p_year UUID)
RETURNS TABLE(
  fee_record_id UUID,
  outstanding_amount NUMERIC
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Check permission
  SELECT CASE WHEN NOT can_manage_finances() THEN
    RAISE(EXCEPTION, 'insufficient_privilege: finance role required')
  END;

  SELECT 
    id,
    GREATEST(
      COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
      0
    )::NUMERIC(12,2)
  FROM public.student_fee_records
  WHERE student_id = p_student_id
    AND academic_year_id = p_year
    AND fee_type = 'Previous Year Dues'
    AND GREATEST(
      COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
      0
    ) > 0;
$$;