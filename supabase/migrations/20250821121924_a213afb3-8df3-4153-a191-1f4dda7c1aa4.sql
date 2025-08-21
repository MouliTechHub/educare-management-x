-- Update v_fee_grid_consolidated to expose fee-type info for the row
CREATE OR REPLACE VIEW public.v_fee_grid_consolidated AS
WITH tuition AS (
  SELECT fr.student_id, fr.academic_year_id, fr.class_id, fr.id as tuition_fee_record_id,
         fr.actual_fee::numeric(12,2) as tuition_actual_fee,
         COALESCE(fr.discount_amount,0)::numeric(12,2) as tuition_discount,
         COALESCE(fr.paid_amount,0)::numeric(12,2)     as tuition_paid,
         GREATEST(COALESCE(fr.actual_fee,0)-COALESCE(fr.discount_amount,0),0)::numeric(12,2) as tuition_final,
         GREATEST(COALESCE(fr.actual_fee,0)-COALESCE(fr.paid_amount,0)-COALESCE(fr.discount_amount,0),0)::numeric(12,2) as tuition_balance,
         fr.due_date as tuition_due_date, fr.status as tuition_status,
         fr.created_at, fr.updated_at, fr.discount_updated_at, fr.discount_updated_by, fr.discount_notes
  FROM public.student_fee_records fr
  WHERE fr.fee_type = 'Tuition Fee'
),
pyd AS (
  SELECT fr.student_id, fr.academic_year_id, fr.class_id, fr.id as pyd_fee_record_id,
         GREATEST(COALESCE(fr.actual_fee,0)-COALESCE(fr.paid_amount,0)-COALESCE(fr.discount_amount,0),0)::numeric(12,2) as pyd_outstanding,
         fr.due_date as pyd_due_date, fr.status as pyd_status
  FROM public.student_fee_records fr
  WHERE fr.fee_type = 'Previous Year Dues'
)
SELECT
  COALESCE(t.student_id, p.student_id)                 AS student_id,
  COALESCE(t.academic_year_id, p.academic_year_id)     AS academic_year_id,
  COALESCE(t.class_id, p.class_id)                     AS class_id,

  -- IDs for actions
  t.tuition_fee_record_id, p.pyd_fee_record_id,

  -- Tuition metrics
  COALESCE(t.tuition_actual_fee,0) AS actual_fee,
  COALESCE(t.tuition_discount,0)   AS discount_amount,
  COALESCE(t.tuition_paid,0)       AS paid_amount,
  COALESCE(t.tuition_final,0)      AS final_fee,
  COALESCE(t.tuition_balance,0)    AS balance_fee,

  -- Existing PYD column
  COALESCE(p.pyd_outstanding,0)    AS previous_year_dues,

  -- Fee type flags/labels for the grid
  (t.tuition_fee_record_id IS NOT NULL) AS has_tuition,
  (p.pyd_fee_record_id    IS NOT NULL) AS has_pyd,
  CASE
    WHEN (t.tuition_fee_record_id IS NOT NULL) AND (p.pyd_fee_record_id IS NOT NULL) THEN 'Tuition Fee + Previous Year Dues'
    WHEN (t.tuition_fee_record_id IS NOT NULL) THEN 'Tuition Fee'
    WHEN (p.pyd_fee_record_id    IS NOT NULL) THEN 'Previous Year Dues'
    ELSE 'N/A'
  END AS fee_type_label,

  -- Totals
  (COALESCE(t.tuition_final,0)   + COALESCE(p.pyd_outstanding,0))  AS final_fee_with_pyd,
  (COALESCE(t.tuition_balance,0) + COALESCE(p.pyd_outstanding,0))  AS balance_fee_with_pyd,

  COALESCE(t.tuition_due_date, p.pyd_due_date) AS due_date,
  COALESCE(t.tuition_status,  p.pyd_status)    AS status,
  
  -- Additional fields for compatibility
  t.created_at,
  t.updated_at,
  t.discount_updated_at,
  t.discount_updated_by,
  t.discount_notes

FROM tuition t
FULL OUTER JOIN pyd p
  ON p.student_id = t.student_id
 AND p.academic_year_id = t.academic_year_id
 AND p.class_id = t.class_id;