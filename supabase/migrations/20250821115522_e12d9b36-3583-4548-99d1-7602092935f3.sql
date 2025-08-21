-- Create consolidated fee grid view that unifies tuition and PYD into one row per student
CREATE OR REPLACE VIEW public.v_fee_grid_consolidated AS
WITH tuition AS (
  SELECT
    fr.student_id, fr.academic_year_id, fr.class_id,
    fr.id as tuition_fee_record_id,
    fr.actual_fee::NUMERIC(12,2)                       AS tuition_actual_fee,
    COALESCE(fr.discount_amount,0)::NUMERIC(12,2)      AS tuition_discount,
    COALESCE(fr.paid_amount,0)::NUMERIC(12,2)          AS tuition_paid,
    GREATEST(COALESCE(fr.actual_fee,0) - COALESCE(fr.discount_amount,0), 0)::NUMERIC(12,2) AS tuition_final,
    GREATEST(COALESCE(fr.actual_fee,0) - COALESCE(fr.paid_amount,0) - COALESCE(fr.discount_amount,0), 0)::NUMERIC(12,2) AS tuition_balance,
    fr.due_date AS tuition_due_date, 
    fr.status AS tuition_status,
    fr.created_at AS tuition_created_at,
    fr.updated_at AS tuition_updated_at,
    fr.discount_notes AS tuition_discount_notes,
    fr.discount_updated_by AS tuition_discount_updated_by,
    fr.discount_updated_at AS tuition_discount_updated_at
  FROM public.student_fee_records fr
  WHERE fr.fee_type = 'Tuition Fee'
),
pyd AS (
  SELECT
    fr.student_id, fr.academic_year_id, fr.class_id,
    fr.id AS pyd_fee_record_id,
    GREATEST(COALESCE(fr.actual_fee,0) - COALESCE(fr.paid_amount,0) - COALESCE(fr.discount_amount,0), 0)::NUMERIC(12,2) AS pyd_outstanding,
    fr.due_date AS pyd_due_date, 
    fr.status AS pyd_status
  FROM public.student_fee_records fr
  WHERE fr.fee_type = 'Previous Year Dues'
)
SELECT
  COALESCE(t.student_id, p.student_id)                         AS student_id,
  COALESCE(t.academic_year_id, p.academic_year_id)             AS academic_year_id,
  COALESCE(t.class_id, p.class_id)                             AS class_id,
  
  -- IDs preserved for actions
  t.tuition_fee_record_id, 
  p.pyd_fee_record_id,
  
  -- Grid fields (tuition data in main columns)
  COALESCE(t.tuition_actual_fee, 0)   AS actual_fee,
  COALESCE(t.tuition_discount, 0)     AS discount_amount,
  COALESCE(t.tuition_paid, 0)         AS paid_amount,
  COALESCE(t.tuition_final, 0)        AS final_fee,
  COALESCE(t.tuition_balance, 0)      AS balance_fee,
  
  -- Previous Year Dues column (PYD outstanding)
  COALESCE(p.pyd_outstanding, 0)      AS previous_year_dues,
  
  -- Optional totals
  (COALESCE(t.tuition_final, 0) + COALESCE(p.pyd_outstanding, 0))  AS final_fee_with_pyd,
  (COALESCE(t.tuition_balance, 0) + COALESCE(p.pyd_outstanding, 0)) AS balance_fee_with_pyd,
  
  -- Meta fields
  COALESCE(t.tuition_due_date, p.pyd_due_date) AS due_date,
  COALESCE(t.tuition_status, p.pyd_status)     AS status,
  COALESCE(t.tuition_created_at, CURRENT_TIMESTAMP) AS created_at,
  COALESCE(t.tuition_updated_at, CURRENT_TIMESTAMP) AS updated_at,
  t.tuition_discount_notes AS discount_notes,
  t.tuition_discount_updated_by AS discount_updated_by,
  t.tuition_discount_updated_at AS discount_updated_at,
  
  -- Student details (join with students table)
  s.id AS student_id_ref,
  s.first_name,
  s.last_name,
  s.admission_number,
  s.class_id AS student_class_id,
  
  -- Class details  
  c.name AS class_name,
  c.section,
  
  -- Year-scoped class (fallback to main class_id)
  COALESCE(se.class_id, COALESCE(t.class_id, p.class_id)) AS enrolled_class_id

FROM tuition t
FULL OUTER JOIN pyd p
  ON p.student_id = t.student_id
 AND p.academic_year_id = t.academic_year_id
 AND p.class_id = t.class_id
LEFT JOIN public.students s ON s.id = COALESCE(t.student_id, p.student_id)
LEFT JOIN public.classes c ON c.id = COALESCE(t.class_id, p.class_id)
LEFT JOIN public.student_enrollments se
  ON se.student_id = COALESCE(t.student_id, p.student_id)
 AND se.academic_year_id = COALESCE(t.academic_year_id, p.academic_year_id);