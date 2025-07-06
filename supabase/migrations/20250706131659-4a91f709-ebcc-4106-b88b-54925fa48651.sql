-- Fix the log_discount_changes function to work with consolidated system
CREATE OR REPLACE FUNCTION public.log_discount_changes()
RETURNS TRIGGER AS $$
DECLARE
    source_table_name TEXT;
BEGIN
    -- Only log if discount_amount actually changed
    IF TG_OP = 'UPDATE' AND (
        ABS(COALESCE(OLD.discount_amount, 0) - COALESCE(NEW.discount_amount, 0)) > 0.01
    ) THEN
        
        -- Determine which table we're working with
        source_table_name := TG_TABLE_NAME;
        
        -- Check for recent duplicates more precisely
        IF NOT EXISTS (
            SELECT 1 FROM public.discount_history 
            WHERE source_fee_id = NEW.id
            AND source_table = source_table_name
            AND ABS(discount_amount - (NEW.discount_amount - COALESCE(OLD.discount_amount, 0))) < 0.01
            AND applied_at > (now() - INTERVAL '5 seconds')
            AND applied_by = COALESCE(NEW.discount_updated_by, 'Admin')
        ) THEN
            INSERT INTO public.discount_history (
                fee_id,
                source_fee_id,
                source_table,
                student_id,
                discount_amount,
                discount_type,
                reason,
                notes,
                applied_by
            ) VALUES (
                NEW.id,       -- Use the student_fee_record id as both fee_id and source_fee_id
                NEW.id,       -- Always store the actual record ID
                source_table_name,
                NEW.student_id,
                NEW.discount_amount - COALESCE(OLD.discount_amount, 0),
                'Fixed Amount',
                CASE 
                    WHEN NEW.discount_notes IS NOT NULL AND NEW.discount_notes != '' THEN NEW.discount_notes
                    WHEN COALESCE(NEW.discount_updated_by, 'Admin') != 'Admin' THEN 'Discount applied by ' || COALESCE(NEW.discount_updated_by, 'Admin')
                    ELSE 'Discount applied'
                END,
                NEW.discount_notes,
                COALESCE(NEW.discount_updated_by, 'Admin')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create discount logging trigger for student_fee_records
DROP TRIGGER IF EXISTS trigger_log_discount_changes ON public.student_fee_records;
CREATE TRIGGER trigger_log_discount_changes
  AFTER UPDATE ON public.student_fee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.log_discount_changes();