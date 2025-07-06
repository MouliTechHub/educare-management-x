
-- Comprehensive fix for discount history duplicates and foreign key issues

-- First, let's see what's causing the foreign key violations
-- Check if discount_history table should reference both fees and student_fee_records

-- Drop the problematic triggers
DROP TRIGGER IF EXISTS fees_discount_history_trigger ON public.fees;
DROP TRIGGER IF EXISTS student_fee_records_discount_history_trigger ON public.student_fee_records;

-- Drop the existing discount logging function
DROP FUNCTION IF EXISTS log_discount_changes();

-- Check the actual table structure and fix foreign key constraints
-- The discount_history table should be able to handle both fee systems

-- Add a new column to distinguish between fee systems
ALTER TABLE public.discount_history 
ADD COLUMN IF NOT EXISTS source_table TEXT DEFAULT 'fees';

-- Add a more flexible fee reference system
ALTER TABLE public.discount_history 
ADD COLUMN IF NOT EXISTS source_fee_id UUID;

-- Update existing records to use the new structure
UPDATE public.discount_history 
SET source_fee_id = fee_id, source_table = 'fees'
WHERE source_fee_id IS NULL;

-- Create a new, more robust discount logging function
CREATE OR REPLACE FUNCTION log_discount_changes()
RETURNS TRIGGER AS $$
DECLARE
    main_fee_id UUID;
    source_table_name TEXT;
BEGIN
    -- Only log if discount_amount actually changed
    IF TG_OP = 'UPDATE' AND (
        ABS(COALESCE(OLD.discount_amount, 0) - COALESCE(NEW.discount_amount, 0)) > 0.01
    ) THEN
        
        -- Determine which table we're working with
        source_table_name := TG_TABLE_NAME;
        
        -- For student_fee_records, try to find corresponding fee record
        IF TG_TABLE_NAME = 'student_fee_records' THEN
            SELECT f.id INTO main_fee_id
            FROM public.fees f
            WHERE f.student_id = NEW.student_id 
            AND f.academic_year_id = NEW.academic_year_id 
            AND f.fee_type = NEW.fee_type
            LIMIT 1;
            
            -- If no corresponding fee record exists, use NULL for fee_id
            -- and store the student_fee_records ID in source_fee_id
        END IF;
        
        -- For fees table, use the fee ID directly
        IF TG_TABLE_NAME = 'fees' THEN
            main_fee_id := NEW.id;
        END IF;
        
        -- Check for recent duplicates more precisely
        IF NOT EXISTS (
            SELECT 1 FROM public.discount_history 
            WHERE COALESCE(fee_id, source_fee_id) = COALESCE(main_fee_id, NEW.id)
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
                main_fee_id,  -- This can be NULL for student_fee_records
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

-- Recreate triggers
CREATE TRIGGER fees_discount_history_trigger
    AFTER UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

CREATE TRIGGER student_fee_records_discount_history_trigger
    AFTER UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

-- Clean up ALL duplicate entries more aggressively
-- Delete duplicates based on student_id, discount_amount, and timestamp proximity
DELETE FROM public.discount_history a 
USING public.discount_history b 
WHERE a.id > b.id 
AND a.student_id = b.student_id 
AND ABS(a.discount_amount - b.discount_amount) < 0.01
AND ABS(EXTRACT(EPOCH FROM (a.applied_at - b.applied_at))) < 30
AND a.applied_by = b.applied_by;

-- Fix any remaining empty reasons
UPDATE public.discount_history 
SET reason = 'Discount applied'
WHERE reason IS NULL OR reason = '' OR reason = 'Discount updated';
