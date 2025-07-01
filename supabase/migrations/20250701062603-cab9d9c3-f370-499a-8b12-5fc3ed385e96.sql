
-- First, let's check and fix the database structure for fee management

-- Ensure the triggers are working properly for auto-assignment
DROP TRIGGER IF EXISTS trigger_auto_assign_tuition_fee ON public.students;
CREATE TRIGGER trigger_auto_assign_tuition_fee
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_tuition_fee();

-- Update existing students to have fee records if they don't have any
-- This will help with the current 3 students that have no fee records
DO $$
DECLARE
    student_record RECORD;
    current_year_id UUID;
    tuition_fee_amount NUMERIC;
    due_date_calculated DATE;
BEGIN
    -- Get current academic year
    SELECT id INTO current_year_id 
    FROM public.academic_years 
    WHERE is_current = true 
    LIMIT 1;
    
    IF current_year_id IS NULL THEN
        -- Create a default academic year if none exists
        INSERT INTO public.academic_years (year_name, start_date, end_date, is_current)
        VALUES ('2024-2025', '2024-04-01', '2025-03-31', true)
        RETURNING id INTO current_year_id;
    END IF;
    
    -- Process each student that doesn't have fee records
    FOR student_record IN 
        SELECT s.id, s.class_id, s.first_name, s.last_name
        FROM public.students s
        WHERE NOT EXISTS (
            SELECT 1 FROM public.student_fee_records sfr 
            WHERE sfr.student_id = s.id 
            AND sfr.academic_year_id = current_year_id
        )
    LOOP
        -- Get tuition fee for the student's class
        SELECT amount INTO tuition_fee_amount
        FROM public.fee_structures
        WHERE class_id = student_record.class_id 
          AND academic_year_id = current_year_id
          AND fee_type = 'Tuition'
          AND is_active = true
        LIMIT 1;
        
        -- If no fee structure found, create a default one
        IF tuition_fee_amount IS NULL THEN
            tuition_fee_amount := 5000; -- Default amount
            
            -- Create fee structure if it doesn't exist
            INSERT INTO public.fee_structures (
                class_id, academic_year_id, fee_type, amount, frequency, description, is_active
            )
            VALUES (
                student_record.class_id, current_year_id, 'Tuition', tuition_fee_amount, 
                'Monthly', 'Default tuition fee', true
            )
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Calculate due date (30 days from now)
        due_date_calculated := CURRENT_DATE + INTERVAL '30 days';
        
        -- Insert fee record
        INSERT INTO public.student_fee_records (
            student_id, class_id, academic_year_id, fee_type, actual_fee, due_date, status
        )
        VALUES (
            student_record.id, student_record.class_id, current_year_id, 
            'Tuition Fee', tuition_fee_amount, due_date_calculated, 'Pending'
        )
        ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        
        -- Log the creation
        INSERT INTO public.fee_change_history (
            fee_record_id, change_type, new_value, amount, changed_by, notes
        )
        SELECT 
            sfr.id, 'creation', tuition_fee_amount, tuition_fee_amount, 'System',
            'Auto-assigned tuition fee for existing student'
        FROM public.student_fee_records sfr
        WHERE sfr.student_id = student_record.id 
          AND sfr.class_id = student_record.class_id 
          AND sfr.academic_year_id = current_year_id
          AND sfr.fee_type = 'Tuition Fee'
        ON CONFLICT DO NOTHING;
        
    END LOOP;
END $$;

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_student_fee_records_lookup ON public.student_fee_records(student_id, academic_year_id, status);
CREATE INDEX IF NOT EXISTS idx_students_class_lookup ON public.students(class_id, status);

-- Add realtime capabilities for fee records
ALTER TABLE public.student_fee_records REPLICA IDENTITY FULL;
ALTER TABLE public.fee_payment_records REPLICA IDENTITY FULL;
ALTER TABLE public.fee_change_history REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
    -- Add tables to realtime publication if not already added
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.student_fee_records;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_payment_records;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_change_history;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;
