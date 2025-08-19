-- 1) Create diagnostic RPC for fee record counting
CREATE OR REPLACE FUNCTION public.debug_fee_counts(p_year uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int FROM public.student_fee_records WHERE academic_year_id = p_year;
$$;

-- 2) Create RPC that accepts year names and resolves to IDs (for UI convenience)
CREATE OR REPLACE FUNCTION public.promote_students_with_fees_by_name(
  source_year_name text,
  target_year_name text,
  promoted_by_user text DEFAULT 'Admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  source_year_id uuid;
  target_year_id uuid;
  promotion_data jsonb;
  result jsonb;
  v_promoted_count int := 0;
  v_fee_rows_created int := 0;
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
  
  -- Get all active students from source year
  WITH students_to_promote AS (
    SELECT 
      s.id as student_id,
      s.class_id as from_class_id,
      source_year_id as from_academic_year_id,
      target_year_id as to_academic_year_id,
      'promoted' as promotion_type,
      'Bulk promotion via promote_students_with_fees_by_name' as reason,
      format('Promoted from %s to %s', source_year_name, target_year_name) as notes
    FROM public.students s
    WHERE s.status = 'Active'
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'student_id', student_id,
      'from_academic_year_id', from_academic_year_id,
      'from_class_id', from_class_id,
      'to_class_id', NULL, -- Let DB compute via get_next_class_id
      'promotion_type', promotion_type,
      'reason', reason,
      'notes', notes
    )
  ) INTO promotion_data
  FROM students_to_promote;
  
  IF promotion_data IS NULL THEN
    RAISE NOTICE '[PROMOTE-RPC] No active students found for promotion';
    RETURN jsonb_build_object(
      'promoted_students', 0,
      'fee_rows_created', 0,
      'target_year_id', target_year_id,
      'message', 'No active students found for promotion'
    );
  END IF;
  
  -- Count students to promote
  SELECT jsonb_array_length(promotion_data) INTO v_promoted_count;
  
  RAISE NOTICE '[PROMOTE-RPC] Promoting % students from % to %', 
    v_promoted_count, source_year_name, target_year_name;
  
  -- Call the main promotion function
  SELECT public.promote_students_with_fees(
    promotion_data,
    target_year_id,
    promoted_by_user,
    format('bulk-%s-%s-%s', source_year_name, target_year_name, extract(epoch from now()))
  ) INTO result;
  
  -- Count fee rows created for target year
  SELECT count(*)::int INTO v_fee_rows_created
  FROM public.student_fee_records 
  WHERE academic_year_id = target_year_id;
  
  RAISE NOTICE '[PROMOTE-RPC] promoted=%, fee_rows=%', v_promoted_count, v_fee_rows_created;
  
  -- Return enhanced result with detailed counts
  RETURN jsonb_build_object(
    'promoted_students', v_promoted_count,
    'fee_rows_created', v_fee_rows_created,
    'target_year_id', target_year_id,
    'source_year_id', source_year_id,
    'original_result', result,
    'message', format('Successfully promoted %s students and created %s fee records for %s', 
                     v_promoted_count, v_fee_rows_created, target_year_name)
  );
END;
$$;