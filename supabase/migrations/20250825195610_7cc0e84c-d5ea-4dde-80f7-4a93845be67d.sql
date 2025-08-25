-- Temporal (SCD-2) enrollments table
CREATE TABLE IF NOT EXISTS public.student_enrollments_hist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('Enrolled','Repeated','Promoted','Withdrawn','Graduated','Transferred')),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,              -- null = current
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_hist_current 
ON public.student_enrollments_hist (student_id, academic_year_id, class_id) 
WHERE valid_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_hist_temporal 
ON public.student_enrollments_hist (student_id, valid_from, valid_to);

-- Smart view: the "current" enrollment per (student, year)
CREATE OR REPLACE VIEW public.v_enrollments_current AS
SELECT * FROM public.student_enrollments_hist
WHERE valid_to IS NULL;

-- Helper to close current row & open a new one (class/status change)
CREATE OR REPLACE FUNCTION public.enrollment_upsert(
  p_student uuid, 
  p_year uuid, 
  p_class uuid, 
  p_status text, 
  p_actor uuid DEFAULT NULL
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Close any current row
  UPDATE public.student_enrollments_hist
     SET valid_to = now()
   WHERE student_id = p_student 
     AND academic_year_id = p_year 
     AND valid_to IS NULL;

  -- Open new row
  INSERT INTO public.student_enrollments_hist(
    student_id, academic_year_id, class_id, status, created_by
  )
  VALUES (p_student, p_year, p_class, p_status, p_actor);
END $$;

-- Immutable financial ledger (journal entries)
CREATE TABLE IF NOT EXISTS public.fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (entry_type IN ('Tuition Charge','Previous Year Dues','Payment','Discount','Adjustment')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  direction text NOT NULL CHECK (direction IN ('DEBIT','CREDIT')), -- debit increases balance, credit reduces
  entry_date date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  reference_id uuid -- link to original payment/discount record
);

-- Indexes for ledger performance
CREATE INDEX IF NOT EXISTS idx_fee_ledger_student_year 
ON public.fee_ledger (student_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_fee_ledger_entry_type 
ON public.fee_ledger (entry_type, direction);

-- Canonical balance view (year-scoped)
CREATE OR REPLACE VIEW public.v_fee_balances AS
SELECT
  student_id, 
  academic_year_id, 
  class_id,
  SUM(CASE WHEN direction = 'DEBIT'  THEN amount ELSE 0 END) AS debits,
  SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END) AS credits,
  (SUM(CASE WHEN direction='DEBIT' THEN amount ELSE 0 END)
   - SUM(CASE WHEN direction='CREDIT' THEN amount ELSE 0 END))::numeric(12,2) AS balance_fee
FROM public.fee_ledger
GROUP BY student_id, academic_year_id, class_id;