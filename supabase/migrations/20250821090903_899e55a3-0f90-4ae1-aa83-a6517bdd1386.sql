-- Fix Payments page error by disambiguating foreign keys (corrected)

-- A) Drop existing constraints and recreate with explicit names
ALTER TABLE public.student_fee_records 
  DROP CONSTRAINT IF EXISTS student_fee_records_student_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_sfr_student;

ALTER TABLE public.fee_payment_records 
  DROP CONSTRAINT IF EXISTS fee_payment_records_fee_record_id_fkey,
  DROP CONSTRAINT IF EXISTS payments_fee_record_id_fkey;

-- B) Add properly named foreign keys for embedding
ALTER TABLE public.student_fee_records
  ADD CONSTRAINT student_fee_records_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.fee_payment_records
  ADD CONSTRAINT fee_payment_records_fee_record_id_fkey 
    FOREIGN KEY (fee_record_id) REFERENCES public.student_fee_records(id) ON DELETE CASCADE;

-- C) Add performance indexes
CREATE INDEX IF NOT EXISTS idx_fee_payment_records_fee_record ON public.fee_payment_records(fee_record_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_records_student ON public.student_fee_records(student_id);

-- D) Create enriched view as alternative (avoiding column name conflicts)
CREATE OR REPLACE VIEW public.v_payments_enriched AS
SELECT 
  p.id,
  p.fee_record_id,
  p.amount_paid,
  p.payment_date,
  p.payment_time,
  p.late_fee,
  p.created_at,
  p.target_academic_year_id,
  p.payment_method,
  p.receipt_number,
  p.payment_receiver,
  p.notes,
  p.created_by,
  fr.academic_year_id,
  fr.fee_type,
  fr.actual_fee,
  fr.discount_amount,
  fr.paid_amount AS fee_paid_amount,
  fr.balance_fee AS fee_balance,
  fr.student_id,
  s.first_name,
  s.last_name,
  s.admission_number,
  c.name AS class_name,
  c.section AS class_section
FROM public.fee_payment_records p
LEFT JOIN public.student_fee_records fr ON fr.id = p.fee_record_id
LEFT JOIN public.students s ON s.id = fr.student_id
LEFT JOIN public.classes c ON c.id = s.class_id;

-- E) Grant permissions on the view
GRANT SELECT ON public.v_payments_enriched TO authenticated, anon;