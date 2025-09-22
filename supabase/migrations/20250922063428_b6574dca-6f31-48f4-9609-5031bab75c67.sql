-- Remove Previous Year Dues from existing fee records and update database functions
-- This migration removes all Previous Year Dues records and updates related functions

-- Delete all Previous Year Dues records from student_fee_records
DELETE FROM public.student_fee_records WHERE fee_type = 'Previous Year Dues';

-- Delete all Previous Year Dues records from fee_structures
DELETE FROM public.fee_structures WHERE fee_type = 'Previous Year Dues';

-- Drop PYD-specific views with CASCADE to handle dependencies
DROP VIEW IF EXISTS public.v_pyd CASCADE;
DROP VIEW IF EXISTS public.v_pyd_per_student CASCADE;

-- Drop PYD-specific functions
DROP FUNCTION IF EXISTS public.get_pyd_summary(uuid);
DROP FUNCTION IF EXISTS public.get_pyd_summary_enhanced(uuid);
DROP FUNCTION IF EXISTS public.apply_previous_year_dues_discount(uuid, uuid, text, numeric, text, text, text);
DROP FUNCTION IF EXISTS public.get_student_pyd_details(uuid, uuid);

-- Update the promotion functions to remove Previous Year Dues creation
DROP FUNCTION IF EXISTS public.promote_students_with_fees_safe(text, text, text);
DROP FUNCTION IF EXISTS public.promote_students_with_fees_by_name(text, text, text);
DROP FUNCTION IF EXISTS public.promote_students_with_fees(jsonb, uuid, text, text);

-- Recreate simplified promotion function without PYD logic
CREATE OR REPLACE FUNCTION public.promote_students_simple(source_year_name text, target_year_name text, promoted_by_user text DEFAULT 'Admin'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  source_year_id uuid;
  target_year_id uuid;
  student_rec RECORD;
  fee_structure_rec RECORD;
  v_promoted_count int := 0;
  v_fee_rows_created int := 0;
BEGIN
  -- Resolve year names to IDs
  SELECT id INTO source_year_id FROM public.academic_years WHERE year_name = source_year_name;
  SELECT id INTO target_year_id FROM public.academic_years WHERE year_name = target_year_name;
  
  IF source_year_id IS NULL THEN
    RAISE EXCEPTION 'Source academic year "%" not found', source_year_name;
  END IF;
  
  IF target_year_id IS NULL THEN
    RAISE EXCEPTION 'Target academic year "%" not found', target_year_name;
  END IF;

  -- Get all active students from source year
  FOR student_rec IN
    SELECT 
      s.id as student_id,
      s.class_id as from_class_id,
      COALESCE(public.get_next_class_id(s.class_id), s.class_id) as to_class_id
    FROM public.students s
    WHERE s.status = 'Active'
  LOOP
    -- Update student's class (promoted to next class)
    UPDATE public.students 
    SET class_id = student_rec.to_class_id, updated_at = now() 
    WHERE id = student_rec.student_id;
    
    v_promoted_count := v_promoted_count + 1;
    
    -- Create promotion record
    INSERT INTO public.student_promotions (
      student_id, from_academic_year_id, to_academic_year_id, 
      from_class_id, to_class_id, promotion_type, 
      reason, notes, promoted_by
    ) VALUES (
      student_rec.student_id, source_year_id, target_year_id,
      student_rec.from_class_id, student_rec.to_class_id, 'promoted',
      'Bulk promotion via promote_students_simple',
      format('Promoted from %s to %s', source_year_name, target_year_name),
      promoted_by_user
    );
    
    -- Create regular fee records from fee_structures (TARGET YEAR ONLY)
    FOR fee_structure_rec IN 
      SELECT fs.* 
      FROM public.fee_structures fs 
      WHERE fs.academic_year_id = target_year_id 
        AND fs.class_id = student_rec.to_class_id 
        AND fs.is_active = true
        AND fs.fee_type != 'Previous Year Dues'
    LOOP
      INSERT INTO public.student_fee_records (
        student_id, class_id, academic_year_id, fee_type, 
        actual_fee, discount_amount, paid_amount, due_date, status
      ) VALUES (
        student_rec.student_id, student_rec.to_class_id, target_year_id,
        fee_structure_rec.fee_type, fee_structure_rec.amount, 0, 0,
        CURRENT_DATE + INTERVAL '30 days', 'Pending'
      )
      ON CONFLICT (student_id, academic_year_id, fee_type) DO NOTHING;
      
      v_fee_rows_created := v_fee_rows_created + 1;
    END LOOP;
  END LOOP;
  
  -- Return result with detailed counts
  RETURN jsonb_build_object(
    'promoted_students', v_promoted_count,
    'fee_rows_created', v_fee_rows_created,
    'target_year_id', target_year_id,
    'source_year_id', source_year_id,
    'message', format('Successfully promoted %s students, created %s fee rows for %s', 
                     v_promoted_count, v_fee_rows_created, target_year_name)
  );
END;
$function$;

-- Update fee filters to exclude Previous Year Dues checks
UPDATE public.student_fee_records 
SET status = 'Paid' 
WHERE balance_fee <= 0 AND status != 'Paid';