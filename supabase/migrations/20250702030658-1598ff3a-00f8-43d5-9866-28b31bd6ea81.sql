
-- Fix data sync issues between payment systems and fee management

-- First, let's ensure we have proper triggers for data consistency
DROP TRIGGER IF EXISTS trigger_update_fee_record_on_payment ON public.fee_payment_records;
DROP TRIGGER IF EXISTS trigger_update_fee_total_paid ON public.payment_history;
DROP TRIGGER IF EXISTS trigger_update_student_fee_balance ON public.student_payments;

-- Create an improved function to sync fee records when payments are made
CREATE OR REPLACE FUNCTION public.sync_fee_records_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    fee_record_id UUID;
    total_payments NUMERIC := 0;
    final_amount NUMERIC := 0;
    current_year_id UUID;
BEGIN
    -- Get current academic year
    SELECT id INTO current_year_id 
    FROM public.academic_years 
    WHERE is_current = true 
    LIMIT 1;

    IF current_year_id IS NULL THEN
        RAISE NOTICE 'No current academic year found';
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Handle different payment table triggers
    IF TG_TABLE_NAME = 'student_payments' THEN
        -- Find or create corresponding fee record
        SELECT sfr.id INTO fee_record_id
        FROM public.student_fee_records sfr
        JOIN public.fee_structures fs ON fs.id = NEW.fee_structure_id
        WHERE sfr.student_id = NEW.student_id
          AND sfr.academic_year_id = current_year_id
          AND sfr.fee_type = fs.fee_type
        LIMIT 1;

        -- If no fee record exists, create one
        IF fee_record_id IS NULL THEN
            INSERT INTO public.student_fee_records (
                student_id, class_id, academic_year_id, fee_type, actual_fee, status
            )
            SELECT 
                NEW.student_id,
                s.class_id,
                current_year_id,
                fs.fee_type,
                fs.amount,
                'Pending'
            FROM public.students s
            JOIN public.fee_structures fs ON fs.id = NEW.fee_structure_id
            WHERE s.id = NEW.student_id
            RETURNING id INTO fee_record_id;
        END IF;

    ELSIF TG_TABLE_NAME = 'fee_payment_records' THEN
        fee_record_id := NEW.fee_record_id;
    END IF;

    -- Calculate total payments for this fee record
    SELECT COALESCE(SUM(fpr.amount_paid), 0) INTO total_payments
    FROM public.fee_payment_records fpr
    WHERE fpr.fee_record_id = fee_record_id;

    -- Also add payments from student_payments table
    SELECT total_payments + COALESCE(SUM(sp.amount_paid), 0) INTO total_payments
    FROM public.student_payments sp
    JOIN public.fee_structures fs ON fs.id = sp.fee_structure_id
    JOIN public.student_fee_records sfr ON sfr.student_id = sp.student_id 
      AND sfr.fee_type = fs.fee_type 
      AND sfr.academic_year_id = current_year_id
    WHERE sfr.id = fee_record_id;

    -- Update the fee record
    UPDATE public.student_fee_records
    SET 
        paid_amount = total_payments,
        status = CASE 
            WHEN (actual_fee - discount_amount) <= total_payments THEN 'Paid'
            WHEN total_payments > 0 THEN 'Partial'
            WHEN due_date < CURRENT_DATE THEN 'Overdue'
            ELSE 'Pending'
        END,
        updated_at = now()
    WHERE id = fee_record_id;

    -- Also update legacy fees table if record exists
    UPDATE public.fees
    SET 
        total_paid = total_payments,
        status = CASE 
            WHEN (actual_amount - discount_amount) <= total_payments THEN 'Paid'
            WHEN total_payments > 0 THEN 'Partial'
            WHEN due_date < CURRENT_DATE THEN 'Overdue'
            ELSE 'Pending'
        END,
        updated_at = now()
    WHERE student_id = COALESCE(NEW.student_id, (SELECT student_id FROM public.student_fee_records WHERE id = fee_record_id))
      AND academic_year_id = current_year_id
      AND fee_type = (SELECT fee_type FROM public.student_fee_records WHERE id = fee_record_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for payment synchronization
CREATE TRIGGER trigger_sync_fee_records_on_student_payment
    AFTER INSERT OR UPDATE OR DELETE ON public.student_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_fee_records_on_payment();

CREATE TRIGGER trigger_sync_fee_records_on_fee_payment
    AFTER INSERT OR UPDATE OR DELETE ON public.fee_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_fee_records_on_payment();

-- Function to remove duplicate fee records
CREATE OR REPLACE FUNCTION public.remove_duplicate_fee_records()
RETURNS void AS $$
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Remove duplicates from student_fee_records, keeping the one with most recent data
    FOR duplicate_record IN
        SELECT student_id, class_id, academic_year_id, fee_type, 
               array_agg(id ORDER BY updated_at DESC, created_at DESC) as ids
        FROM public.student_fee_records
        GROUP BY student_id, class_id, academic_year_id, fee_type
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (most recent) record, delete the rest
        DELETE FROM public.student_fee_records 
        WHERE id = ANY(duplicate_record.ids[2:]);
        
        RAISE NOTICE 'Removed duplicate fee records for student %, class %, year %, fee type %', 
                     duplicate_record.student_id, duplicate_record.class_id, 
                     duplicate_record.academic_year_id, duplicate_record.fee_type;
    END LOOP;

    -- Remove duplicates from fees table
    FOR duplicate_record IN
        SELECT student_id, academic_year_id, fee_type,
               array_agg(id ORDER BY updated_at DESC, created_at DESC) as ids
        FROM public.fees
        GROUP BY student_id, academic_year_id, fee_type
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (most recent) record, delete the rest
        DELETE FROM public.fees 
        WHERE id = ANY(duplicate_record.ids[2:]);
        
        RAISE NOTICE 'Removed duplicate legacy fee records for student %, year %, fee type %', 
                     duplicate_record.student_id, duplicate_record.academic_year_id, duplicate_record.fee_type;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the deduplication
SELECT public.remove_duplicate_fee_records();

-- Recalculate all payment totals to fix existing data
DO $$
DECLARE
    fee_record RECORD;
    total_payments NUMERIC;
BEGIN
    FOR fee_record IN SELECT * FROM public.student_fee_records LOOP
        -- Calculate total from fee_payment_records
        SELECT COALESCE(SUM(amount_paid), 0) INTO total_payments
        FROM public.fee_payment_records
        WHERE fee_record_id = fee_record.id;
        
        -- Add payments from student_payments
        SELECT total_payments + COALESCE(SUM(sp.amount_paid), 0) INTO total_payments
        FROM public.student_payments sp
        JOIN public.fee_structures fs ON fs.id = sp.fee_structure_id
        WHERE sp.student_id = fee_record.student_id
          AND fs.fee_type = fee_record.fee_type;
        
        -- Update the record
        UPDATE public.student_fee_records
        SET 
            paid_amount = total_payments,
            status = CASE 
                WHEN (actual_fee - discount_amount) <= total_payments THEN 'Paid'
                WHEN total_payments > 0 THEN 'Partial'
                WHEN due_date < CURRENT_DATE THEN 'Overdue'
                ELSE 'Pending'
            END,
            updated_at = now()
        WHERE id = fee_record.id;
    END LOOP;
    
    -- Also fix legacy fees table
    FOR fee_record IN SELECT * FROM public.fees LOOP
        SELECT COALESCE(SUM(amount_paid), 0) INTO total_payments
        FROM public.payment_history
        WHERE fee_id = fee_record.id;
        
        UPDATE public.fees
        SET 
            total_paid = total_payments,
            status = CASE 
                WHEN (actual_amount - discount_amount) <= total_payments THEN 'Paid'
                WHEN total_payments > 0 THEN 'Partial'
                WHEN due_date < CURRENT_DATE THEN 'Overdue'
                ELSE 'Pending'
            END,
            updated_at = now()
        WHERE id = fee_record.id;
    END LOOP;
END $$;

-- Add constraints to prevent negative balances
ALTER TABLE public.student_fee_records 
ADD CONSTRAINT check_non_negative_balance 
CHECK (balance_fee >= 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_fee_records_sync ON public.student_fee_records(student_id, academic_year_id, fee_type);
CREATE INDEX IF NOT EXISTS idx_student_payments_sync ON public.student_payments(student_id, fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_payment_records_sync ON public.fee_payment_records(fee_record_id, student_id);
