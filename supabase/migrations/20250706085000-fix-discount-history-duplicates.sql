
-- Fix discount history duplicate entries and improve logging logic

-- Drop existing triggers to recreate them properly
DROP TRIGGER IF EXISTS fees_discount_history_trigger ON public.fees;
DROP TRIGGER IF EXISTS student_fee_records_discount_history_trigger ON public.student_fee_records;

-- Create improved discount logging function
CREATE OR REPLACE FUNCTION log_discount_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if discount_amount actually changed and is a meaningful change
    IF TG_OP = 'UPDATE' AND (
        ABS(COALESCE(OLD.discount_amount, 0) - COALESCE(NEW.discount_amount, 0)) > 0.01
    ) THEN
        -- Prevent duplicate entries by checking recent history with more strict conditions
        IF NOT EXISTS (
            SELECT 1 FROM public.discount_history 
            WHERE fee_id = NEW.id 
            AND ABS(discount_amount - (NEW.discount_amount - COALESCE(OLD.discount_amount, 0))) < 0.01
            AND applied_at > (now() - INTERVAL '10 seconds')
            AND applied_by = COALESCE(NEW.discount_updated_by, 'Admin')
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
                CASE 
                    WHEN NEW.discount_notes IS NOT NULL AND NEW.discount_notes != '' THEN NEW.discount_notes
                    WHEN COALESCE(NEW.discount_updated_by, 'Admin') != 'Admin' THEN 'Discount applied by ' || COALESCE(NEW.discount_updated_by, 'Admin')
                    ELSE 'Discount updated'
                END,
                NEW.discount_notes,
                COALESCE(NEW.discount_updated_by, 'Admin')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with improved logic
CREATE TRIGGER fees_discount_history_trigger
    AFTER UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

CREATE TRIGGER student_fee_records_discount_history_trigger
    AFTER UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

-- Clean up duplicate discount history entries
-- Keep the most recent entry for each fee_id with the same discount amount
DELETE FROM public.discount_history a USING public.discount_history b 
WHERE a.id > b.id 
AND a.fee_id = b.fee_id 
AND ABS(a.discount_amount - b.discount_amount) < 0.01
AND a.applied_at - b.applied_at < INTERVAL '30 seconds'
AND a.applied_by = b.applied_by;

-- Update existing records to have consistent reasons
UPDATE public.discount_history 
SET reason = CASE 
    WHEN reason = '' OR reason IS NULL THEN 'Discount applied'
    ELSE reason 
END
WHERE reason = '' OR reason IS NULL;
