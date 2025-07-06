
-- Fix payment synchronization between all payment systems
-- This ensures Fee Management reflects accurate paid amounts and balances

-- Drop existing triggers to recreate them properly
DROP TRIGGER IF EXISTS trigger_sync_fee_records_on_student_payment ON public.student_payments;
DROP TRIGGER IF EXISTS trigger_sync_fee_records_on_fee_payment ON public.fee_payment_records;
DROP TRIGGER IF EXISTS trigger_update_fee_total_paid ON public.payment_history;

-- Create comprehensive payment synchronization function
CREATE OR REPLACE FUNCTION public.sync_all_payment_systems()
RETURNS TRIGGER AS $$
DECLARE
    current_year_id UUID;
    fee_record_id UUID;
    enhanced_fee_record_id UUID;
    total_payments NUMERIC := 0;
    target_student_id UUID;
    target_fee_type TEXT;
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

    -- Determine target student and fee type based on trigger source
    IF TG_TABLE_NAME = 'student_payments' THEN
        target_student_id := COALESCE(NEW.student_id, OLD.student_id);
        
        -- Get fee type from fee structure
        SELECT fs.fee_type INTO target_fee_type
        FROM public.fee_structures fs
        WHERE fs.id = COALESCE(NEW.fee_structure_id, OLD.fee_structure_id);
        
    ELSIF TG_TABLE_NAME = 'payment_history' THEN
        target_student_id := COALESCE(NEW.student_id, OLD.student_id);
        target_fee_type := COALESCE(NEW.fee_type, OLD.fee_type);
        
    ELSIF TG_TABLE_NAME = 'fee_payment_records' THEN
        target_student_id := COALESCE(NEW.student_id, OLD.student_id);
        
        -- Get fee type from student_fee_records
        SELECT sfr.fee_type INTO target_fee_type
        FROM public.student_fee_records sfr
        WHERE sfr.id = COALESCE(NEW.fee_record_id, OLD.fee_record_id);
    END IF;

    IF target_student_id IS NULL OR target_fee_type IS NULL THEN
        RAISE NOTICE 'Could not determine student or fee type';
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Find main fee record
    SELECT id INTO fee_record_id
    FROM public.fees
    WHERE student_id = target_student_id
      AND academic_year_id = current_year_id
      AND fee_type = target_fee_type;

    -- Find enhanced fee record
    SELECT id INTO enhanced_fee_record_id
    FROM public.student_fee_records
    WHERE student_id = target_student_id
      AND academic_year_id = current_year_id
      AND fee_type = target_fee_type;

    -- Calculate total payments from all sources for this student and fee type
    
    -- From payment_history (if fee record exists)
    IF fee_record_id IS NOT NULL THEN
        SELECT COALESCE(SUM(amount_paid), 0) INTO total_payments
        FROM public.payment_history
        WHERE fee_id = fee_record_id;
    END IF;

    -- Add payments from student_payments
    SELECT total_payments + COALESCE(SUM(sp.amount_paid), 0) INTO total_payments
    FROM public.student_payments sp
    JOIN public.fee_structures fs ON fs.id = sp.fee_structure_id
    WHERE sp.student_id = target_student_id
      AND fs.fee_type = target_fee_type;

    -- Add payments from fee_payment_records (if enhanced record exists)
    IF enhanced_fee_record_id IS NOT NULL THEN
        SELECT total_payments + COALESCE(SUM(fpr.amount_paid), 0) INTO total_payments
        FROM public.fee_payment_records fpr
        WHERE fpr.fee_record_id = enhanced_fee_record_id;
    END IF;

    RAISE NOTICE 'Calculated total payments: % for student: % fee type: %', total_payments, target_student_id, target_fee_type;

    -- Update main fees table if record exists
    IF fee_record_id IS NOT NULL THEN
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
        WHERE id = fee_record_id;
        
        RAISE NOTICE 'Updated main fee record: %', fee_record_id;
    END IF;

    -- Update enhanced fee records table if record exists
    IF enhanced_fee_record_id IS NOT NULL THEN
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
        WHERE id = enhanced_fee_record_id;
        
        RAISE NOTICE 'Updated enhanced fee record: %', enhanced_fee_record_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all payment tables
CREATE TRIGGER trigger_sync_payments_on_student_payment
    AFTER INSERT OR UPDATE OR DELETE ON public.student_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_payment_systems();

CREATE TRIGGER trigger_sync_payments_on_payment_history
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_history
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_payment_systems();

CREATE TRIGGER trigger_sync_payments_on_fee_payment_records
    AFTER INSERT OR UPDATE OR DELETE ON public.fee_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_all_payment_systems();

-- Recalculate all existing payment totals to fix current data
DO $$
DECLARE
    student_record RECORD;
    fee_record RECORD;
    total_payments NUMERIC;
    current_year_id UUID;
BEGIN
    -- Get current academic year
    SELECT id INTO current_year_id 
    FROM public.academic_years 
    WHERE is_current = true 
    LIMIT 1;

    IF current_year_id IS NULL THEN
        RAISE NOTICE 'No current academic year found for recalculation';
        RETURN;
    END IF;

    RAISE NOTICE 'Starting payment recalculation for academic year: %', current_year_id;

    -- Recalculate for all fee records in main fees table
    FOR fee_record IN 
        SELECT DISTINCT student_id, fee_type, id
        FROM public.fees 
        WHERE academic_year_id = current_year_id
    LOOP
        total_payments := 0;
        
        -- From payment_history
        SELECT COALESCE(SUM(amount_paid), 0) INTO total_payments
        FROM public.payment_history
        WHERE fee_id = fee_record.id;
        
        -- Add from student_payments
        SELECT total_payments + COALESCE(SUM(sp.amount_paid), 0) INTO total_payments
        FROM public.student_payments sp
        JOIN public.fee_structures fs ON fs.id = sp.fee_structure_id
        WHERE sp.student_id = fee_record.student_id
          AND fs.fee_type = fee_record.fee_type;
        
        -- Update the fee record
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
        
        RAISE NOTICE 'Updated fee record % with total payments: %', fee_record.id, total_payments;
    END LOOP;

    -- Recalculate for all enhanced fee records
    FOR fee_record IN 
        SELECT DISTINCT student_id, fee_type, id
        FROM public.student_fee_records 
        WHERE academic_year_id = current_year_id
    LOOP
        total_payments := 0;
        
        -- From fee_payment_records
        SELECT COALESCE(SUM(amount_paid), 0) INTO total_payments
        FROM public.fee_payment_records
        WHERE fee_record_id = fee_record.id;
        
        -- Add from student_payments
        SELECT total_payments + COALESCE(SUM(sp.amount_paid), 0) INTO total_payments
        FROM public.student_payments sp
        JOIN public.fee_structures fs ON fs.id = sp.fee_structure_id
        WHERE sp.student_id = fee_record.student_id
          AND fs.fee_type = fee_record.fee_type;
        
        -- Update the enhanced fee record
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
        
        RAISE NOTICE 'Updated enhanced fee record % with total payments: %', fee_record.id, total_payments;
    END LOOP;

    RAISE NOTICE 'Payment recalculation completed';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_payments_student_fee_type ON public.student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_fee_student ON public.payment_history(fee_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payment_records_fee_student ON public.fee_payment_records(fee_record_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_year_type ON public.fees(student_id, academic_year_id, fee_type);
CREATE INDEX IF NOT EXISTS idx_student_fee_records_student_year_type ON public.student_fee_records(student_id, academic_year_id, fee_type);
