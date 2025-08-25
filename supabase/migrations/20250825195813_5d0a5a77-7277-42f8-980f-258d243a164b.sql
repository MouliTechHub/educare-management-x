-- Continue with ledger-based consolidated view and archiving

-- Update fee grid consolidated to use ledger (temporary dual-read approach)
DROP VIEW IF EXISTS public.v_fee_grid_consolidated;

CREATE OR REPLACE VIEW public.v_fee_grid_consolidated AS
WITH tuition AS (
  SELECT 
    student_id, academic_year_id, class_id,
    SUM(CASE WHEN entry_type='Tuition Charge' AND direction='DEBIT' THEN amount ELSE 0 END) AS tuition_actual,
    SUM(CASE WHEN entry_type='Discount' AND direction='CREDIT' THEN amount ELSE 0 END) AS tuition_discount,
    SUM(CASE WHEN entry_type='Payment' AND direction='CREDIT' THEN amount ELSE 0 END) AS tuition_paid
  FROM public.fee_ledger
  WHERE entry_type IN ('Tuition Charge', 'Discount', 'Payment')
  GROUP BY student_id, academic_year_id, class_id
),
pyd AS (
  SELECT 
    student_id, academic_year_id, class_id,
    (SUM(CASE WHEN entry_type='Previous Year Dues' AND direction='DEBIT' THEN amount ELSE 0 END)
     - SUM(CASE WHEN entry_type IN ('Payment','Discount','Adjustment') AND direction='CREDIT' THEN amount ELSE 0 END)) AS previous_year_dues
  FROM public.fee_ledger  
  WHERE entry_type IN ('Previous Year Dues', 'Payment', 'Discount', 'Adjustment')
  GROUP BY student_id, academic_year_id, class_id
),
-- Fallback to existing data for now (dual-read)
existing_tuition AS (
  SELECT 
    sfr.student_id, sfr.academic_year_id, sfr.class_id, sfr.id as tuition_fee_record_id,
    sfr.actual_fee AS tuition_actual_fee,
    COALESCE(sfr.discount_amount,0) AS tuition_discount,
    COALESCE(sfr.paid_amount,0) AS tuition_paid,
    GREATEST(COALESCE(sfr.actual_fee,0)-COALESCE(sfr.discount_amount,0),0) AS tuition_final,
    GREATEST(COALESCE(sfr.actual_fee,0)-COALESCE(sfr.paid_amount,0)-COALESCE(sfr.discount_amount,0),0) AS tuition_balance,
    sfr.due_date AS tuition_due_date, 
    sfr.status AS tuition_status,
    sfr.created_at, sfr.updated_at, sfr.discount_updated_at, sfr.discount_updated_by, sfr.discount_notes
  FROM public.student_fee_records sfr
  WHERE sfr.fee_type = 'Tuition Fee'
),
existing_pyd AS (
  SELECT 
    sfr.student_id, sfr.academic_year_id, sfr.class_id, sfr.id as pyd_fee_record_id,
    GREATEST(COALESCE(sfr.actual_fee,0)-COALESCE(sfr.paid_amount,0)-COALESCE(sfr.discount_amount,0),0) AS pyd_outstanding,
    sfr.due_date AS pyd_due_date, 
    sfr.status AS pyd_status
  FROM public.student_fee_records sfr
  WHERE sfr.fee_type = 'Previous Year Dues'
)
SELECT
  COALESCE(et.student_id, ep.student_id, t.student_id, p.student_id) AS student_id,
  COALESCE(et.academic_year_id, ep.academic_year_id, t.academic_year_id, p.academic_year_id) AS academic_year_id,
  COALESCE(et.class_id, ep.class_id, t.class_id, p.class_id) AS class_id,

  -- IDs for actions (existing system)
  et.tuition_fee_record_id, 
  ep.pyd_fee_record_id,

  -- Prefer ledger data, fallback to existing
  COALESCE(t.tuition_actual, et.tuition_actual_fee, 0)::numeric(12,2) AS actual_fee,
  COALESCE(t.tuition_discount, et.tuition_discount, 0)::numeric(12,2) AS discount_amount,
  COALESCE(t.tuition_paid, et.tuition_paid, 0)::numeric(12,2) AS paid_amount,
  GREATEST(COALESCE(t.tuition_actual, et.tuition_actual_fee, 0) - COALESCE(t.tuition_discount, et.tuition_discount, 0), 0)::numeric(12,2) AS final_fee,
  GREATEST(
    COALESCE(t.tuition_actual, et.tuition_actual_fee, 0) - 
    COALESCE(t.tuition_paid, et.tuition_paid, 0) - 
    COALESCE(t.tuition_discount, et.tuition_discount, 0), 0
  )::numeric(12,2) AS balance_fee,

  -- PYD from ledger or existing
  COALESCE(p.previous_year_dues, ep.pyd_outstanding, 0)::numeric(12,2) AS previous_year_dues,

  -- Fee type flags
  (et.tuition_fee_record_id IS NOT NULL OR t.student_id IS NOT NULL) AS has_tuition,
  (ep.pyd_fee_record_id IS NOT NULL OR p.student_id IS NOT NULL) AS has_pyd,
  CASE
    WHEN (et.tuition_fee_record_id IS NOT NULL OR t.student_id IS NOT NULL) 
     AND (ep.pyd_fee_record_id IS NOT NULL OR p.student_id IS NOT NULL) 
    THEN 'Tuition Fee + Previous Year Dues'
    WHEN (et.tuition_fee_record_id IS NOT NULL OR t.student_id IS NOT NULL) 
    THEN 'Tuition Fee'
    WHEN (ep.pyd_fee_record_id IS NOT NULL OR p.student_id IS NOT NULL) 
    THEN 'Previous Year Dues'
    ELSE 'N/A'
  END AS fee_type_label,

  COALESCE(et.tuition_due_date, ep.pyd_due_date) AS due_date,
  COALESCE(et.tuition_status, ep.pyd_status, 'Pending') AS status,
  
  -- Metadata
  et.created_at,
  et.updated_at,
  et.discount_updated_at,
  et.discount_updated_by,
  et.discount_notes

FROM existing_tuition et
FULL OUTER JOIN existing_pyd ep 
  ON ep.student_id = et.student_id
  AND ep.academic_year_id = et.academic_year_id
  AND ep.class_id = et.class_id
FULL OUTER JOIN tuition t
  ON t.student_id = COALESCE(et.student_id, ep.student_id)
  AND t.academic_year_id = COALESCE(et.academic_year_id, ep.academic_year_id)
  AND t.class_id = COALESCE(et.class_id, ep.class_id)
FULL OUTER JOIN pyd p
  ON p.student_id = COALESCE(et.student_id, ep.student_id, t.student_id)
  AND p.academic_year_id = COALESCE(et.academic_year_id, ep.academic_year_id, t.academic_year_id)
  AND p.class_id = COALESCE(et.class_id, ep.class_id, t.class_id);

-- Archive functionality for students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

-- Update status check constraint to include Archived
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_status_check'
    ) THEN
        ALTER TABLE public.students DROP CONSTRAINT students_status_check;
    END IF;
    
    ALTER TABLE public.students 
    ADD CONSTRAINT students_status_check 
    CHECK (status IN ('Active','Inactive','Transferred','Graduated','Archived'));
END $$;

-- Archive student function
CREATE OR REPLACE FUNCTION public.archive_student(
  p_student uuid, 
  p_reason text DEFAULT 'user_request', 
  p_anonymize bool DEFAULT true
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  -- Permission check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege: admin role required';
  END IF;

  UPDATE public.students
     SET deleted_at = now(),
         status = 'Archived',
         deleted_reason = p_reason,
         -- Optional PII minimization, keeps IDs for joins
         first_name = CASE WHEN p_anonymize THEN 'Former' ELSE first_name END,
         last_name = CASE WHEN p_anonymize THEN concat('Student-', substr(id::text,1,8)) ELSE last_name END
   WHERE id = p_student AND deleted_at IS NULL;
   
   -- Log the archival
   PERFORM log_security_event(
     'student_archived',
     'students',
     p_student,
     jsonb_build_object('reason', p_reason, 'anonymized', p_anonymize)
   );
END $$;

-- Prevent hard deletes
CREATE OR REPLACE FUNCTION public.prevent_student_hard_delete()
RETURNS trigger 
LANGUAGE plpgsql 
SET search_path TO 'public'
AS $$
BEGIN
  RAISE EXCEPTION 'Hard delete disabled; use archive_student() function';
END $$;

DROP TRIGGER IF EXISTS trg_students_no_delete ON public.students;
CREATE TRIGGER trg_students_no_delete 
BEFORE DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.prevent_student_hard_delete();

-- RLS-safe view for active students
CREATE OR REPLACE VIEW public.v_active_students AS
SELECT s.*, c.name as class_name, c.section
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
WHERE s.deleted_at IS NULL;

-- Dual-write helper for ledger entries
CREATE OR REPLACE FUNCTION public.record_ledger_entry(
  p_student_id uuid,
  p_academic_year_id uuid,
  p_class_id uuid,
  p_entry_type text,
  p_amount numeric,
  p_direction text,
  p_note text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ledger_id uuid;
BEGIN
  INSERT INTO public.fee_ledger (
    student_id, academic_year_id, class_id, entry_type, 
    amount, direction, note, created_by, reference_id
  )
  VALUES (
    p_student_id, p_academic_year_id, p_class_id, p_entry_type,
    p_amount, p_direction, p_note, auth.uid(), p_reference_id
  )
  RETURNING id INTO ledger_id;
  
  RETURN ledger_id;
END $$;