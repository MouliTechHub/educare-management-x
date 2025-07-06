
-- Professional Database Cleanup and Optimization
-- Remove redundant tables and establish clear relationships

-- 1. First, let's backup important data before cleanup
CREATE TABLE IF NOT EXISTS fees_migration_backup AS 
SELECT * FROM public.fees;

CREATE TABLE IF NOT EXISTS student_fee_records_migration_backup AS 
SELECT * FROM public.student_fee_records;

-- 2. Drop redundant and unused tables
DROP TABLE IF EXISTS public.fee_discounts CASCADE;
DROP TABLE IF EXISTS public.fees_backup CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE; -- Duplicate of student_payments
DROP TABLE IF EXISTS public.student_fee_assignments CASCADE; -- Redundant with student_fee_records

-- 3. Consolidate fee management into a single, clear structure
-- Keep student_fee_records as the main fee table (it's more comprehensive)
-- Remove the old fees table after migrating essential data

-- Migrate any missing data from fees to student_fee_records
INSERT INTO public.student_fee_records (
    student_id, 
    class_id, 
    academic_year_id, 
    fee_type, 
    actual_fee, 
    discount_amount, 
    paid_amount, 
    due_date, 
    status,
    discount_notes,
    discount_updated_by,
    discount_updated_at,
    created_at,
    updated_at
)
SELECT DISTINCT
    f.student_id,
    s.class_id,
    f.academic_year_id,
    f.fee_type,
    f.actual_amount,
    f.discount_amount,
    f.total_paid,
    f.due_date,
    f.status,
    f.discount_notes,
    f.discount_updated_by,
    f.discount_updated_at,
    f.created_at,
    f.updated_at
FROM public.fees f
JOIN public.students s ON f.student_id = s.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.student_fee_records sfr 
    WHERE sfr.student_id = f.student_id 
    AND sfr.academic_year_id = f.academic_year_id 
    AND sfr.fee_type = f.fee_type
);

-- 4. Clean up discount_history to reference only student_fee_records
-- Update foreign key to point to student_fee_records instead of fees
ALTER TABLE public.discount_history DROP CONSTRAINT IF EXISTS discount_history_fee_id_fkey;

-- Add proper foreign key to student_fee_records
ALTER TABLE public.discount_history 
ADD CONSTRAINT discount_history_fee_record_fkey 
FOREIGN KEY (source_fee_id) REFERENCES public.student_fee_records(id) ON DELETE CASCADE;

-- Update existing discount_history records to reference student_fee_records
UPDATE public.discount_history dh
SET source_fee_id = sfr.id, source_table = 'student_fee_records'
FROM public.student_fee_records sfr
WHERE dh.student_id = sfr.student_id 
AND dh.source_table = 'fees'
AND sfr.fee_type = (
    SELECT fee_type FROM public.fees f WHERE f.id = dh.fee_id
);

-- 5. Migrate payment_history to fee_payment_records structure
INSERT INTO public.fee_payment_records (
    fee_record_id,
    student_id,
    amount_paid,
    payment_date,
    payment_time,
    payment_method,
    receipt_number,
    payment_receiver,
    notes,
    created_at
)
SELECT DISTINCT
    sfr.id,
    ph.student_id,
    ph.amount_paid,
    ph.payment_date,
    ph.payment_time,
    ph.payment_method,
    ph.receipt_number,
    ph.payment_receiver,
    ph.notes,
    ph.created_at
FROM public.payment_history ph
JOIN public.student_fee_records sfr ON ph.student_id = sfr.student_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.fee_payment_records fpr 
    WHERE fpr.student_id = ph.student_id 
    AND fpr.receipt_number = ph.receipt_number
);

-- 6. Now safely drop the old fees table
DROP TABLE IF EXISTS public.fees CASCADE;

-- 7. Drop redundant payment_history table
DROP TABLE IF EXISTS public.payment_history CASCADE;

-- 8. Add proper constraints and indexes for performance
-- Ensure no duplicate fee records per student/year/type
ALTER TABLE public.student_fee_records 
DROP CONSTRAINT IF EXISTS unique_student_fee_record_academic_year;

ALTER TABLE public.student_fee_records 
ADD CONSTRAINT unique_student_fee_record_academic_year 
UNIQUE (student_id, fee_type, academic_year_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_fee_records_student_year 
ON public.student_fee_records(student_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_student_fee_records_status 
ON public.student_fee_records(status);

CREATE INDEX IF NOT EXISTS idx_fee_payment_records_fee_record 
ON public.fee_payment_records(fee_record_id);

CREATE INDEX IF NOT EXISTS idx_discount_history_student 
ON public.discount_history(student_id, applied_at DESC);

-- 9. Update student_fee_records to have computed columns
ALTER TABLE public.student_fee_records 
ADD COLUMN IF NOT EXISTS final_fee NUMERIC GENERATED ALWAYS AS (actual_fee - discount_amount) STORED;

ALTER TABLE public.student_fee_records 
ADD COLUMN IF NOT EXISTS balance_fee NUMERIC GENERATED ALWAYS AS (actual_fee - discount_amount - paid_amount) STORED;

-- 10. Create a clean trigger system for the simplified structure
DROP TRIGGER IF EXISTS fees_discount_history_trigger ON public.fees;
DROP TRIGGER IF EXISTS student_fee_records_discount_history_trigger ON public.student_fee_records;

CREATE OR REPLACE FUNCTION public.log_fee_discount_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if discount_amount actually changed
    IF TG_OP = 'UPDATE' AND (
        ABS(COALESCE(OLD.discount_amount, 0) - COALESCE(NEW.discount_amount, 0)) > 0.01
    ) THEN
        -- Check for recent duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.discount_history 
            WHERE source_fee_id = NEW.id
            AND ABS(discount_amount - (NEW.discount_amount - COALESCE(OLD.discount_amount, 0))) < 0.01
            AND applied_at > (now() - INTERVAL '10 seconds')
            AND applied_by = COALESCE(NEW.discount_updated_by, 'Admin')
        ) THEN
            INSERT INTO public.discount_history (
                source_fee_id,
                source_table,
                student_id,
                discount_amount,
                discount_type,
                reason,
                notes,
                applied_by
            ) VALUES (
                NEW.id,
                'student_fee_records',
                NEW.student_id,
                NEW.discount_amount - COALESCE(OLD.discount_amount, 0),
                'Fixed Amount',
                COALESCE(NEW.discount_notes, 'Discount applied'),
                NEW.discount_notes,
                COALESCE(NEW.discount_updated_by, 'Admin')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create single trigger for the main fee table
CREATE TRIGGER student_fee_records_discount_trigger
    AFTER UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION public.log_fee_discount_changes();

-- 11. Update payment tracking trigger
CREATE OR REPLACE FUNCTION public.update_fee_payments()
RETURNS TRIGGER AS $$
BEGIN
    -- Update paid amount in student_fee_records
    UPDATE public.student_fee_records
    SET 
        paid_amount = COALESCE((
            SELECT SUM(amount_paid) 
            FROM public.fee_payment_records 
            WHERE fee_record_id = NEW.fee_record_id
        ), 0),
        status = CASE 
            WHEN (actual_fee - discount_amount) <= COALESCE((
                SELECT SUM(amount_paid) 
                FROM public.fee_payment_records 
                WHERE fee_record_id = NEW.fee_record_id
            ), 0) THEN 'Paid'
            WHEN COALESCE((
                SELECT SUM(amount_paid) 
                FROM public.fee_payment_records 
                WHERE fee_record_id = NEW.fee_record_id
            ), 0) > 0 THEN 'Partial'
            WHEN due_date < CURRENT_DATE THEN 'Overdue'
            ELSE 'Pending'
        END,
        updated_at = now()
    WHERE id = NEW.fee_record_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fee_payment_update_trigger
    AFTER INSERT OR UPDATE ON public.fee_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fee_payments();

-- 12. Clean up any remaining orphaned records
DELETE FROM public.discount_history WHERE source_fee_id NOT IN (SELECT id FROM public.student_fee_records);
DELETE FROM public.fee_payment_records WHERE fee_record_id NOT IN (SELECT id FROM public.student_fee_records);
DELETE FROM public.student_payments WHERE student_id NOT IN (SELECT id FROM public.students);
