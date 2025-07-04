-- Clean up duplicate fee records and fix database consistency
-- First, create a backup of current state
CREATE TABLE IF NOT EXISTS fees_backup AS SELECT * FROM public.fees;

-- Delete duplicate fee records, keeping only the latest one for each student+fee_type+academic_year
DELETE FROM public.fees a USING public.fees b 
WHERE a.id < b.id 
AND a.student_id = b.student_id 
AND a.academic_year_id = b.academic_year_id 
AND a.fee_type = b.fee_type;

-- Clean up orphaned payment_history records that reference deleted fees
DELETE FROM public.payment_history 
WHERE fee_id NOT IN (SELECT id FROM public.fees);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.fees DROP CONSTRAINT IF EXISTS unique_student_fee_academic_year;
ALTER TABLE public.fees ADD CONSTRAINT unique_student_fee_academic_year 
UNIQUE (student_id, fee_type, academic_year_id);

-- Same for student_fee_records
DELETE FROM public.student_fee_records a USING public.student_fee_records b 
WHERE a.id < b.id 
AND a.student_id = b.student_id 
AND a.academic_year_id = b.academic_year_id 
AND a.fee_type = b.fee_type;

ALTER TABLE public.student_fee_records DROP CONSTRAINT IF EXISTS unique_student_fee_record_academic_year;
ALTER TABLE public.student_fee_records ADD CONSTRAINT unique_student_fee_record_academic_year 
UNIQUE (student_id, fee_type, academic_year_id);