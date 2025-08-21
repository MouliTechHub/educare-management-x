-- Create canonical fee grid view with exact column names expected by the UI
CREATE OR REPLACE VIEW public.v_fee_grid AS
SELECT
  fr.id,
  fr.student_id,
  fr.class_id,
  fr.academic_year_id,
  fr.fee_type,
  fr.actual_fee,           -- required by grid
  fr.discount_amount,      -- required by grid
  fr.paid_amount,          -- required by grid
  GREATEST(COALESCE(fr.actual_fee,0) - COALESCE(fr.discount_amount,0), 0)::NUMERIC(12,2) AS final_fee,  -- grid uses this label
  GREATEST(COALESCE(fr.actual_fee,0) - COALESCE(fr.paid_amount,0) - COALESCE(fr.discount_amount,0), 0)::NUMERIC(12,2) AS balance_fee,
  fr.due_date,
  fr.status,
  fr.created_at,
  fr.updated_at,
  fr.discount_notes,
  fr.discount_updated_by,
  fr.discount_updated_at,
  -- Year-scoped class (fallback to fr.class_id)
  COALESCE(se.class_id, fr.class_id) AS enrolled_class_id,
  -- Student details
  s.id as student_id_ref,
  s.first_name,
  s.last_name,
  s.admission_number,
  s.class_id as student_class_id,
  -- Class details  
  c.name as class_name,
  c.section,
  -- Previous year dues calculation
  COALESCE(pyd_calc.previous_year_dues, 0) AS previous_year_dues
FROM public.student_fee_records fr
LEFT JOIN public.student_enrollments se
  ON se.student_id = fr.student_id
  AND se.academic_year_id = fr.academic_year_id
LEFT JOIN public.students s ON s.id = fr.student_id
LEFT JOIN public.classes c ON c.id = COALESCE(se.class_id, fr.class_id)
LEFT JOIN LATERAL (
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN pyd_fr.fee_type = 'Previous Year Dues' 
        THEN GREATEST(COALESCE(pyd_fr.actual_fee,0) - COALESCE(pyd_fr.paid_amount,0) - COALESCE(pyd_fr.discount_amount,0), 0)
        ELSE 0
      END
    ), 0) AS previous_year_dues
  FROM public.student_fee_records pyd_fr
  WHERE pyd_fr.student_id = fr.student_id
    AND pyd_fr.academic_year_id = fr.academic_year_id
    AND pyd_fr.fee_type = 'Previous Year Dues'
) pyd_calc ON true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_v_fee_grid_year ON public.student_fee_records(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_v_fee_grid_due ON public.student_fee_records(due_date);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_composite ON public.student_enrollments(student_id, academic_year_id);