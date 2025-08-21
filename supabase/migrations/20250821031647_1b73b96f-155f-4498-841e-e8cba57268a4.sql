-- ============================================================================
-- A) Database: canonical views, unique guard, and cleanup
-- ============================================================================

-- 1. Create canonical views (scoped per year)
CREATE OR REPLACE VIEW public.v_fee_outstanding AS
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

CREATE OR REPLACE VIEW public.v_pyd AS
SELECT 
  academic_year_id, 
  student_id, 
  class_id, 
  outstanding
FROM public.v_fee_outstanding
WHERE fee_type = 'Previous Year Dues';

CREATE OR REPLACE VIEW public.v_pyd_per_student AS
SELECT 
  academic_year_id,
  student_id,
  SUM(outstanding)::NUMERIC(12,2) AS pyd_per_student
FROM public.v_pyd
GROUP BY academic_year_id, student_id;

-- 2. Add uniqueness so one PYD row per student/year
-- PYD is not class-specific - one PYD record per student per academic year
CREATE UNIQUE INDEX IF NOT EXISTS u_pyd_per_student_year
  ON public.student_fee_records(student_id, academic_year_id)
  WHERE fee_type = 'Previous Year Dues';

-- 3. Cleanup wrong rows created by earlier promotions
-- Remove PYD that exists in years other than the immediate target year of a promotion
WITH bad_pyd AS (
  SELECT DISTINCT pyd.id
  FROM student_fee_records pyd
  JOIN student_promotions sp ON sp.student_id = pyd.student_id
  WHERE pyd.fee_type = 'Previous Year Dues'
    AND pyd.academic_year_id != sp.to_academic_year_id  -- PYD must live only in target year
    -- Additional safety: only remove if there's a proper PYD in the target year
    AND EXISTS (
      SELECT 1 FROM student_fee_records correct_pyd 
      WHERE correct_pyd.student_id = pyd.student_id 
        AND correct_pyd.fee_type = 'Previous Year Dues'
        AND correct_pyd.academic_year_id = sp.to_academic_year_id
    )
)
DELETE FROM student_fee_records s
USING bad_pyd b
WHERE s.id = b.id;

-- Recompute balance safely for all rows
UPDATE public.student_fee_records
SET balance_fee = GREATEST(
  COALESCE(actual_fee,0) - COALESCE(paid_amount,0) - COALESCE(discount_amount,0),
  0
);

-- 4. Update summary RPC to use canonical views and add priority buckets
CREATE OR REPLACE FUNCTION public.get_pyd_summary(p_year uuid)
RETURNS TABLE(
  students_with_dues integer,
  total_outstanding numeric,
  avg_per_student numeric,
  high_count integer,
  medium_count integer,
  low_count integer
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check permission
  IF NOT can_manage_finances() THEN
    RAISE EXCEPTION 'insufficient_privilege: finance role required';
  END IF;

  RETURN QUERY
  WITH pyd_per_student AS (
    SELECT 
      student_id,
      SUM(outstanding) AS pyd_outstanding
    FROM public.v_pyd
    WHERE academic_year_id = p_year
    GROUP BY student_id
    HAVING SUM(outstanding) > 0
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
END;
$$;