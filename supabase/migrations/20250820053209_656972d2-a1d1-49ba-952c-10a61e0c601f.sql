-- 1) Per-row outstanding for PYD
CREATE OR REPLACE VIEW public.v_pyd AS
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

-- 2) Per-student PYD in a year
CREATE OR REPLACE VIEW public.v_pyd_per_student AS
SELECT 
  academic_year_id, 
  student_id,
  SUM(pyd_outstanding)::NUMERIC(12,2) AS pyd_per_student
FROM public.v_pyd
GROUP BY academic_year_id, student_id;

-- 3) Summary RPC used by the UI cards
CREATE OR REPLACE FUNCTION public.get_pyd_summary(p_year UUID)
RETURNS TABLE(
  students_with_dues INT,
  total_outstanding  NUMERIC,
  avg_per_student    NUMERIC,
  high_count         INT,   -- >= 25000
  medium_count       INT,   -- 10000..24999.99
  low_count          INT    -- 0..9999.99
)
LANGUAGE SQL STABLE AS $$
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