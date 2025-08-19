-- Fix indexes - remove CONCURRENTLY for transaction compatibility
CREATE INDEX IF NOT EXISTS idx_fee_records_year 
ON public.student_fee_records (academic_year_id, student_id);

CREATE UNIQUE INDEX IF NOT EXISTS u_fee_records_comp 
ON public.student_fee_records (student_id, class_id, academic_year_id, fee_type);