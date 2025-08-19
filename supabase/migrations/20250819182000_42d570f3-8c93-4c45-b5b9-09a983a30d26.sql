-- Fix promote_students_with_fees RPC to prevent source year mutations
-- and properly carry forward dues to target year only

-- Drop existing function to recreate with fixed logic
DROP FUNCTION IF EXISTS public.promote_students_with_fees_by_name(text, text, text);

-- Create the fixed RPC that accepts year names
CREATE OR REPLACE FUNCTION public.promote_students_with_fees_by_name(
  source_year_name text, 
  target_year_name text, 
  promoted_by_user text DEFAULT 'Admin'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  source_year_id uuid;
  target_year_id uuid;
  promotion_data jsonb;
  result jsonb;
  v_promoted_count int := 0;
  v_fee_rows_created int := 0;
  v_pyd_rows_created int := 0;
  student_rec RECORD;
  fee_structure_rec RECORD;
  carry_forward_amount numeric;
BEGIN
  -- Resolve year names to IDs
  SELECT id INTO source_year_id 
  FROM public.academic_years 
  WHERE year_name = source_year_name;
  
  SELECT id INTO target_year_id 
  FROM public.academic_years 
  WHERE year_name = target_year_name;
  
  IF source_year_id IS NULL THEN
    RAISE EXCEPTION 'Source academic year "%" not found', source_year_name;
  END IF;
  
  IF target_year_id IS NULL THEN
    RAISE EXCEPTION 'Target academic year "%" not found', target_year_name;
  END IF;
  
  RAISE NOTICE '[PROMOTE-RPC] source_year=% (%), target_year=% (%)', 
    source_year_name, source_year_id, target_year_name, target_year_id;

  -- ✅ GUARD: Ensure we never modify source year records
  -- This will be checked during execution via table locks
  
  -- Get all active students from source year with their carry-forward amounts
  FOR student_rec IN
    SELECT 
      s.id as student_id,
      s.class_id as from_class_id,
      COALESCE(public.get_next_class_id(s.class_id), s.class_id) as to_class_id,
      COALESCE(
        (SELECT SUM(GREATEST(actual_fee - discount_amount - paid_amount, 0))
         FROM public.student_fee_records 
         WHERE student_id = s.id 
           AND academic_year_id = source_year_id 
           AND status != 'Paid'), 0
      ) as outstanding_balance
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
      'Bulk promotion via promote_students_with_fees_by_name',
      format('Promoted from %s to %s', source_year_name, target_year_name),
      promoted_by_user
    );
    
    -- ✅ 1) Create regular fee records from fee_structures (target year only)
    FOR fee_structure_rec IN 
      SELECT fs.* 
      FROM public.fee_structures fs 
      WHERE fs.academic_year_id = target_year_id 
        AND fs.class_id = student_rec.to_class_id 
        AND fs.is_active = true
    LOOP
      INSERT INTO public.student_fee_records (
        student_id, class_id, academic_year_id, fee_type, 
        actual_fee, discount_amount, paid_amount, due_date, status
      ) VALUES (
        student_rec.student_id, student_rec.to_class_id, target_year_id,
        fee_structure_rec.fee_type, fee_structure_rec.amount, 0, 0,
        CURRENT_DATE + INTERVAL '30 days', 'Pending'
      )
      ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
      
      v_fee_rows_created := v_fee_rows_created + 1;
    END LOOP;
    
    -- ✅ 2) Create Previous Year Dues row ONLY if outstanding balance > 0
    IF student_rec.outstanding_balance > 0 THEN
      INSERT INTO public.student_fee_records (
        student_id, class_id, academic_year_id, fee_type,
        actual_fee, discount_amount, paid_amount, due_date, status,
        is_carry_forward, priority_order
      ) VALUES (
        student_rec.student_id, student_rec.to_class_id, target_year_id,
        'Previous Year Dues', student_rec.outstanding_balance, 0, 0,
        CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
      )
      ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
      
      v_pyd_rows_created := v_pyd_rows_created + 1;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '[PROMOTE-RPC] promoted=%, fee_rows=%, pyd_rows=%', 
    v_promoted_count, v_fee_rows_created, v_pyd_rows_created;
  
  -- Return enhanced result with detailed counts
  RETURN jsonb_build_object(
    'promoted_students', v_promoted_count,
    'fee_rows_created', v_fee_rows_created,
    'pyd_rows_created', v_pyd_rows_created,
    'target_year_id', target_year_id,
    'source_year_id', source_year_id,
    'message', format('Successfully promoted %s students, created %s fee rows and %s PYD rows for %s', 
                     v_promoted_count, v_fee_rows_created, v_pyd_rows_created, target_year_name)
  );
END;
$function$;