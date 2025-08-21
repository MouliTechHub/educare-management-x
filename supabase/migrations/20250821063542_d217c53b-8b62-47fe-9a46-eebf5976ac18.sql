-- A) Create student_enrollments table for year-scoped enrollment
CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

-- Enable RLS on student_enrollments
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_enrollments
CREATE POLICY "Role-based enrollment access" ON public.student_enrollments
  FOR SELECT USING (
    is_admin() OR 
    has_role('teacher'::app_role) OR 
    has_role('accountant'::app_role) OR 
    (has_role('parent'::app_role) AND EXISTS (
      SELECT 1 FROM student_parent_links spl
      JOIN parents p ON spl.parent_id = p.id
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE spl.student_id = student_enrollments.student_id
      AND (p.email = pr.email OR p.phone_number = pr.email)
    ))
  );

CREATE POLICY "Only admins can modify enrollments" ON public.student_enrollments
  FOR ALL USING (is_admin());

-- B) Create canonical views with outstanding formula
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

-- C) Uniqueness guard for PYD (one PYD per student per year)
CREATE UNIQUE INDEX IF NOT EXISTS u_pyd_per_student_year
  ON public.student_fee_records(student_id, academic_year_id)
  WHERE fee_type = 'Previous Year Dues';

-- D) Cleanup: Remove PYD in wrong years (not matching promotion target)
WITH bad_pyd AS (
  SELECT DISTINCT pyd.id
  FROM public.student_fee_records pyd
  LEFT JOIN public.student_promotions sp 
    ON sp.student_id = pyd.student_id 
    AND sp.to_academic_year_id = pyd.academic_year_id
  WHERE pyd.fee_type = 'Previous Year Dues'
    AND sp.id IS NULL  -- No matching promotion to this year
)
DELETE FROM public.student_fee_records s 
USING bad_pyd b 
WHERE s.id = b.id;

-- E) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_fee_records_year_student 
  ON public.student_fee_records(academic_year_id, student_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_year_student 
  ON public.student_enrollments(academic_year_id, student_id);

CREATE INDEX IF NOT EXISTS idx_fee_records_type_year 
  ON public.student_fee_records(fee_type, academic_year_id) 
  WHERE fee_type = 'Previous Year Dues';

-- F) Add discount tagging columns
ALTER TABLE public.discount_history 
  ADD COLUMN IF NOT EXISTS applies_to TEXT CHECK (applies_to IN ('current', 'pyd')) DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS tag TEXT;

-- G) Update existing promotion RPC to be idempotent and guarded
CREATE OR REPLACE FUNCTION public.promote_students_with_fees_safe(
  source_year_name TEXT,
  target_year_name TEXT,
  promoted_by_user TEXT DEFAULT 'Admin'::TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  source_year_id UUID;
  target_year_id UUID;
  student_rec RECORD;
  fee_structure_rec RECORD;
  v_promoted_count INT := 0;
  v_class_fee_rows INT := 0;
  v_pyd_rows INT := 0;
  -- Source year guards
  source_count_before INT;
  source_actual_sum_before NUMERIC;
  source_paid_sum_before NUMERIC;
  source_count_after INT;
  source_actual_sum_after NUMERIC;
  source_paid_sum_after NUMERIC;
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
  
  RAISE NOTICE '[PROMOTE-SAFE] source_year=% (%), target_year=% (%)', 
    source_year_name, source_year_id, target_year_name, target_year_id;

  -- GUARD: Capture SOURCE year snapshot BEFORE promotion
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
      s.id AS student_id,
      se.class_id AS from_class_id,
      COALESCE(public.get_next_class_id(se.class_id), se.class_id) AS to_class_id,
      COALESCE(
        (SELECT SUM(GREATEST(actual_fee - discount_amount - paid_amount, 0))
         FROM public.student_fee_records 
         WHERE student_id = s.id 
           AND academic_year_id = source_year_id 
           AND status != 'Paid'), 0
      ) AS outstanding_balance
    FROM public.students s
    JOIN public.student_enrollments se ON s.id = se.student_id AND se.academic_year_id = source_year_id
    WHERE s.status = 'Active'
  LOOP
    -- Insert target year enrollment (idempotent)
    INSERT INTO public.student_enrollments (
      student_id, academic_year_id, class_id, enrollment_date
    ) VALUES (
      student_rec.student_id, target_year_id, student_rec.to_class_id, CURRENT_DATE
    )
    ON CONFLICT (student_id, academic_year_id) DO NOTHING;
    
    -- Update student's current class (for legacy compatibility)
    UPDATE public.students 
    SET class_id = student_rec.to_class_id, updated_at = now() 
    WHERE id = student_rec.student_id;
    
    v_promoted_count := v_promoted_count + 1;
    
    -- Create promotion record (idempotent)
    INSERT INTO public.student_promotions (
      student_id, from_academic_year_id, to_academic_year_id, 
      from_class_id, to_class_id, promotion_type, 
      reason, notes, promoted_by
    ) VALUES (
      student_rec.student_id, source_year_id, target_year_id,
      student_rec.from_class_id, student_rec.to_class_id, 'promoted',
      'Bulk promotion via promote_students_with_fees_safe',
      format('Promoted from %s to %s', source_year_name, target_year_name),
      promoted_by_user
    )
    ON CONFLICT (student_id, from_academic_year_id, to_academic_year_id) DO NOTHING;
    
    -- 1) Create regular fee records from fee_structures (TARGET YEAR ONLY)
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
      
      GET DIAGNOSTICS v_class_fee_rows = ROW_COUNT;
      IF v_class_fee_rows > 0 THEN
        v_class_fee_rows := v_class_fee_rows + 1;
      END IF;
    END LOOP;
    
    -- 2) Create Previous Year Dues row ONLY if outstanding balance > 0 (TARGET YEAR ONLY)
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
      ON CONFLICT (student_id, academic_year_id) 
      WHERE fee_type = 'Previous Year Dues' DO NOTHING;
      
      GET DIAGNOSTICS v_pyd_rows = ROW_COUNT;
      IF v_pyd_rows > 0 THEN
        v_pyd_rows := v_pyd_rows + 1;
      END IF;
    END IF;
  END LOOP;
  
  -- GUARD: Verify SOURCE year snapshot AFTER promotion
  SELECT 
    COUNT(*),
    COALESCE(SUM(actual_fee), 0),
    COALESCE(SUM(paid_amount), 0)
  INTO source_count_after, source_actual_sum_after, source_paid_sum_after
  FROM public.student_fee_records 
  WHERE academic_year_id = source_year_id;
  
  RAISE NOTICE '[SOURCE-GUARD] AFTER: count=%, actual_sum=%, paid_sum=%', 
    source_count_after, source_actual_sum_after, source_paid_sum_after;

  -- CRITICAL CHECK: Source year integrity
  IF source_count_before != source_count_after OR 
     ABS(source_actual_sum_before - source_actual_sum_after) > 0.01 OR 
     ABS(source_paid_sum_before - source_paid_sum_after) > 0.01 THEN
    RAISE EXCEPTION 'SOURCE_YEAR_MUTATION_DETECTED: before[%,%,%] != after[%,%,%]', 
      source_count_before, source_actual_sum_before, source_paid_sum_before,
      source_count_after, source_actual_sum_after, source_paid_sum_after;
  END IF;
  
  RAISE NOTICE '[PROMOTE-SAFE] promoted=%, class_fee_rows=%, pyd_rows=%', 
    v_promoted_count, v_class_fee_rows, v_pyd_rows;
  
  -- Return enhanced result with detailed counts
  RETURN jsonb_build_object(
    'promoted_students', v_promoted_count,
    'class_fee_rows', v_class_fee_rows,
    'pyd_rows', v_pyd_rows,
    'target_year_id', target_year_id,
    'source_year_id', source_year_id,
    'message', format('Successfully promoted %s students, created %s class fee rows and %s PYD rows for %s', 
                     v_promoted_count, v_class_fee_rows, v_pyd_rows, target_year_name)
  );
END;
$$;

-- H) Enhanced PYD Summary RPC with buckets
CREATE OR REPLACE FUNCTION public.get_pyd_summary_enhanced(p_year UUID)
RETURNS TABLE(
  students_with_dues INTEGER, 
  total_outstanding NUMERIC, 
  avg_per_student NUMERIC,
  high_count INTEGER,
  medium_count INTEGER,
  low_count INTEGER
)
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      COUNT(*)::INTEGER AS students_with_dues,
      COALESCE(SUM(pyd_outstanding), 0)::NUMERIC(12,2) AS total_outstanding,
      CASE WHEN COUNT(*) > 0 
        THEN (COALESCE(SUM(pyd_outstanding), 0) / COUNT(*))::NUMERIC(12,2)
        ELSE 0::NUMERIC(12,2)
      END AS avg_per_student
    FROM pyd_per_student
  ),
  buckets AS (
    SELECT
      SUM(CASE WHEN pyd_outstanding >= 25000 THEN 1 ELSE 0 END)::INTEGER AS high_count,
      SUM(CASE WHEN pyd_outstanding >= 10000 AND pyd_outstanding < 25000 THEN 1 ELSE 0 END)::INTEGER AS medium_count,
      SUM(CASE WHEN pyd_outstanding > 0 AND pyd_outstanding < 10000 THEN 1 ELSE 0 END)::INTEGER AS low_count
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

-- I) Populate student_enrollments from existing data
INSERT INTO public.student_enrollments (student_id, academic_year_id, class_id, enrollment_date)
SELECT DISTINCT 
  sfr.student_id,
  sfr.academic_year_id,
  sfr.class_id,
  COALESCE(
    (SELECT MIN(created_at::DATE) FROM public.student_fee_records WHERE student_id = sfr.student_id AND academic_year_id = sfr.academic_year_id),
    CURRENT_DATE
  ) AS enrollment_date
FROM public.student_fee_records sfr
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_enrollments se 
  WHERE se.student_id = sfr.student_id AND se.academic_year_id = sfr.academic_year_id
)
ON CONFLICT (student_id, academic_year_id) DO NOTHING;