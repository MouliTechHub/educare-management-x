-- ============================================================================
-- A) Database: canonical views, unique guard, and cleanup (Fixed v2)
-- ============================================================================

-- 1. Drop existing views first to avoid naming conflicts
DROP VIEW IF EXISTS public.v_pyd_per_student;
DROP VIEW IF EXISTS public.v_pyd;
DROP VIEW IF EXISTS public.v_fee_outstanding;

-- 2. Create canonical views (scoped per year)
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

-- 3. Add uniqueness so one PYD row per student/year
-- PYD is not class-specific - one PYD record per student per academic year
CREATE UNIQUE INDEX IF NOT EXISTS u_pyd_per_student_year
  ON public.student_fee_records(student_id, academic_year_id)
  WHERE fee_type = 'Previous Year Dues';

-- 4. Cleanup wrong rows created by earlier promotions
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

-- 5. Update summary RPC to use canonical views and add priority buckets
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

-- 6. B) Fix promotion RPC to enforce target-year only PYD with source year guard
CREATE OR REPLACE FUNCTION public.promote_students_with_fees_by_name(
  source_year_name text, 
  target_year_name text, 
  promoted_by_user text DEFAULT 'Admin'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  source_year_id uuid;
  target_year_id uuid;
  student_rec RECORD;
  fee_structure_rec RECORD;
  v_promoted_count int := 0;
  v_fee_rows_created int := 0;
  v_pyd_rows_created int := 0;
  -- SOURCE YEAR GUARDS
  source_count_before int;
  source_actual_sum_before numeric;
  source_paid_sum_before numeric;
  source_count_after int;
  source_actual_sum_after numeric;
  source_paid_sum_after numeric;
BEGIN
  -- Resolve year names to IDs
  SELECT id INTO source_year_id FROM public.academic_years WHERE year_name = source_year_name;
  SELECT id INTO target_year_id FROM public.academic_years WHERE year_name = target_year_name;
  
  IF source_year_id IS NULL THEN
    RAISE EXCEPTION 'Source academic year "%" not found', source_year_name;
  END IF;
  
  IF target_year_id IS NULL THEN
    RAISE EXCEPTION 'Target academic year "%" not found', target_year_name;
  END IF;
  
  RAISE NOTICE '[PROMOTE-RPC] source_year=% (%), target_year=% (%)', 
    source_year_name, source_year_id, target_year_name, target_year_id;

  -- ✅ GUARD: Capture SOURCE year snapshot BEFORE promotion
  SELECT 
    COUNT(*),
    COALESCE(SUM(actual_fee), 0),
    COALESCE(SUM(paid_amount), 0)
  INTO source_count_before, source_actual_sum_before, source_paid_sum_before
  FROM public.student_fee_records 
  WHERE academic_year_id = source_year_id;
  
  RAISE NOTICE '[SOURCE-GUARD] BEFORE: count=%, actual_sum=%, paid_sum=%', 
    source_count_before, source_actual_sum_before, source_paid_sum_before;

  -- Get all active students from source year with their carry-forward amounts
  FOR student_rec IN
    SELECT 
      s.id as student_id,
      s.class_id as from_class_id,
      COALESCE(public.get_next_class_id(s.class_id), s.class_id) as to_class_id,
      COALESCE(
        (SELECT SUM(GREATEST(actual_fee - discount_amount - paid_amount, 0))
         FROM public.student_fee_records 
         WHERE student_id = s.id 
           AND academic_year_id = source_year_id 
           AND status != 'Paid'), 0
      ) as outstanding_balance
    FROM public.students s
    WHERE s.status = 'Active'
  LOOP
    -- Update student's class (promoted to next class)
    UPDATE public.students 
    SET class_id = student_rec.to_class_id, updated_at = now() 
    WHERE id = student_rec.student_id;
    
    v_promoted_count := v_promoted_count + 1;
    
    -- Create promotion record
    INSERT INTO public.student_promotions (
      student_id, from_academic_year_id, to_academic_year_id, 
      from_class_id, to_class_id, promotion_type, 
      reason, notes, promoted_by
    ) VALUES (
      student_rec.student_id, source_year_id, target_year_id,
      student_rec.from_class_id, student_rec.to_class_id, 'promoted',
      'Bulk promotion via promote_students_with_fees_by_name',
      format('Promoted from %s to %s', source_year_name, target_year_name),
      promoted_by_user
    );
    
    -- ✅ 1) Create regular fee records from fee_structures (TARGET YEAR ONLY)
    FOR fee_structure_rec IN 
      SELECT fs.* 
      FROM public.fee_structures fs 
      WHERE fs.academic_year_id = target_year_id 
        AND fs.class_id = student_rec.to_class_id 
        AND fs.is_active = true
    LOOP
      INSERT INTO public.student_fee_records (
        student_id, class_id, academic_year_id, fee_type, 
        actual_fee, discount_amount, paid_amount, due_date, status
      ) VALUES (
        student_rec.student_id, student_rec.to_class_id, target_year_id,
        fee_structure_rec.fee_type, fee_structure_rec.amount, 0, 0,
        CURRENT_DATE + INTERVAL '30 days', 'Pending'
      )
      ON CONFLICT (student_id, academic_year_id, fee_type) DO NOTHING;
      
      v_fee_rows_created := v_fee_rows_created + 1;
    END LOOP;
    
    -- ✅ 2) Create Previous Year Dues row ONLY if outstanding balance > 0 (TARGET YEAR ONLY)
    IF student_rec.outstanding_balance > 0 THEN
      INSERT INTO public.student_fee_records (
        student_id, class_id, academic_year_id, fee_type,
        actual_fee, discount_amount, paid_amount, due_date, status,
        is_carry_forward, priority_order
      ) VALUES (
        student_rec.student_id, student_rec.to_class_id, target_year_id,
        'Previous Year Dues', student_rec.outstanding_balance, 0, 0,
        CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
      )
      ON CONFLICT (student_id, academic_year_id, fee_type) DO NOTHING;
      
      v_pyd_rows_created := v_pyd_rows_created + 1;
    END IF;
  END LOOP;
  
  -- ✅ GUARD: Verify SOURCE year snapshot AFTER promotion
  SELECT 
    COUNT(*),
    COALESCE(SUM(actual_fee), 0),
    COALESCE(SUM(paid_amount), 0)
  INTO source_count_after, source_actual_sum_after, source_paid_sum_after
  FROM public.student_fee_records 
  WHERE academic_year_id = source_year_id;
  
  RAISE NOTICE '[SOURCE-GUARD] AFTER: count=%, actual_sum=%, paid_sum=%', 
    source_count_after, source_actual_sum_after, source_paid_sum_after;

  -- ✅ CRITICAL CHECK: Source year integrity
  IF source_count_before != source_count_after OR 
     ABS(source_actual_sum_before - source_actual_sum_after) > 0.01 OR 
     ABS(source_paid_sum_before - source_paid_sum_after) > 0.01 THEN
    RAISE EXCEPTION 'SOURCE_YEAR_MUTATION_DETECTED: before[%,%,%] != after[%,%,%]', 
      source_count_before, source_actual_sum_before, source_paid_sum_before,
      source_count_after, source_actual_sum_after, source_paid_sum_after;
  END IF;
  
  RAISE NOTICE '[PROMOTE-RPC] promoted=%, fee_rows=%, pyd_rows=%', 
    v_promoted_count, v_fee_rows_created, v_pyd_rows_created;
  
  -- Return enhanced result with detailed counts
  RETURN jsonb_build_object(
    'promoted_students', v_promoted_count,
    'fee_rows_created', v_fee_rows_created,
    'pyd_rows_created', v_pyd_rows_created,
    'target_year_id', target_year_id,
    'source_year_id', source_year_id,
    'message', format('Successfully promoted %s students, created %s fee rows and %s PYD rows for %s', 
                     v_promoted_count, v_fee_rows_created, v_pyd_rows_created, target_year_name)
  );
END;
$$;