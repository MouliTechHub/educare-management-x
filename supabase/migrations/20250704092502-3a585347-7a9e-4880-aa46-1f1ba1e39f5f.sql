-- Fix discount triggers to prevent duplicate entries
DROP TRIGGER IF EXISTS fees_discount_history_trigger ON public.fees;
DROP TRIGGER IF EXISTS student_fee_records_discount_history_trigger ON public.student_fee_records;

-- Recreate more precise discount logging trigger
CREATE OR REPLACE FUNCTION log_discount_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if discount_amount actually changed and is a meaningful change
    IF TG_OP = 'UPDATE' AND (
        ABS(COALESCE(OLD.discount_amount, 0) - COALESCE(NEW.discount_amount, 0)) > 0.01
    ) THEN
        -- Prevent duplicate entries by checking recent history
        IF NOT EXISTS (
            SELECT 1 FROM public.discount_history 
            WHERE fee_id = NEW.id 
            AND discount_amount = (NEW.discount_amount - COALESCE(OLD.discount_amount, 0))
            AND applied_at > (now() - INTERVAL '5 seconds')
        ) THEN
            INSERT INTO public.discount_history (
                fee_id,
                student_id,
                discount_amount,
                discount_type,
                reason,
                notes,
                applied_by
            ) VALUES (
                NEW.id,
                NEW.student_id,
                NEW.discount_amount - COALESCE(OLD.discount_amount, 0),
                'Fixed Amount',
                COALESCE(NEW.discount_notes, 'Discount updated'),
                NEW.discount_notes,
                COALESCE(NEW.discount_updated_by, 'Admin')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with more controlled logic
CREATE TRIGGER fees_discount_history_trigger
    AFTER UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

CREATE TRIGGER student_fee_records_discount_history_trigger
    AFTER UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

-- Clean up duplicate fee records for same student/academic year/fee type
DELETE FROM public.fees a USING public.fees b 
WHERE a.id > b.id 
AND a.student_id = b.student_id 
AND a.academic_year_id = b.academic_year_id 
AND a.fee_type = b.fee_type;

-- Clean up duplicate enhanced fee records
DELETE FROM public.student_fee_records a USING public.student_fee_records b 
WHERE a.id > b.id 
AND a.student_id = b.student_id 
AND a.academic_year_id = b.academic_year_id 
AND a.fee_type = b.fee_type;