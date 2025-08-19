-- Harden promotion RPC with before/after snapshots and safer data-fix (fixed)
-- 1. Update promotion RPC with proper snapshots and hardened guards

CREATE OR REPLACE FUNCTION public.promote_students_with_fees(promotion_data jsonb, target_academic_year_id uuid, promoted_by_user text, idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  req_id UUID;
  computed_key TEXT;
  existing_result JSONB;
  existing_status TEXT;
  promotion_record JSONB;
  fee_structures RECORD;
  from_class UUID;
  to_class UUID;
  student UUID;
  result_json JSONB := '{"promoted": 0, "repeated": 0, "dropouts": 0, "errors": []}'::JSONB;
  
  -- Source year snapshot variables (captured BEFORE any writes)
  source_count_before INT := 0;
  source_sum_actual_before NUMERIC := 0;
  source_sum_paid_before NUMERIC := 0;
  source_sum_balance_before NUMERIC := 0;
  
  -- After-write snapshot variables for guard
  source_count_after INT := 0;
  source_sum_actual_after NUMERIC := 0;
  source_sum_paid_after NUMERIC := 0;
  source_sum_balance_after NUMERIC := 0;
  
  -- Counters
  v_promoted_count INT := 0;
  v_fee_rows_created INT := 0;
  v_pyd_rows_created INT := 0;
  outstanding_balance NUMERIC := 0;
BEGIN
  computed_key := COALESCE(idempotency_key, md5(promotion_data::TEXT || target_academic_year_id::TEXT || promoted_by_user));

  SELECT pr.id, pr.result, pr.status 
  INTO req_id, existing_result, existing_status
  FROM public.promotion_requests pr 
  WHERE pr.idempotency_key = computed_key;

  IF existing_status = 'completed' THEN
    RETURN existing_result;
  ELSIF existing_status = 'processing' THEN
    RAISE EXCEPTION 'request_in_progress';
  END IF;

  INSERT INTO public.promotion_requests(idempotency_key, request_payload, target_academic_year_id, promoted_by_user, status)
  VALUES (computed_key, promotion_data, target_academic_year_id, promoted_by_user, 'processing')
  RETURNING id INTO req_id;

  -- CAPTURE SOURCE-YEAR SNAPSHOT BEFORE ANY WRITES
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(actual_fee), 0),
    COALESCE(SUM(paid_amount), 0),
    COALESCE(SUM(balance_fee), 0)
  INTO 
    source_count_before,
    source_sum_actual_before, 
    source_sum_paid_before,
    source_sum_balance_before
  FROM public.student_fee_records sfr
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(promotion_data) AS p(item)
    WHERE (p.item->>'from_academic_year_id')::UUID = sfr.academic_year_id
      AND (p.item->>'student_id')::UUID = sfr.student_id
  );

  RAISE NOTICE '[PROMOTE-RPC] Source snapshot BEFORE: count=%, actual=%, paid=%, balance=%', 
    source_count_before, source_sum_actual_before, source_sum_paid_before, source_sum_balance_before;

  FOR promotion_record IN SELECT * FROM jsonb_array_elements(promotion_data)
  LOOP
    student := (promotion_record->>'student_id')::UUID;
    from_class := (promotion_record->>'from_class_id')::UUID;

    IF promotion_record->>'promotion_type' = 'dropout' THEN
      to_class := NULL;
    ELSIF promotion_record->>'promotion_type' = 'repeated' THEN
      to_class := from_class;
    ELSE
      to_class := COALESCE(
        NULLIF(promotion_record->>'to_class_id','')::UUID,
        public.get_next_class_id(from_class)
      );
    END IF;

    INSERT INTO public.student_promotions (
      student_id, from_academic_year_id, to_academic_year_id, from_class_id, to_class_id,
      promotion_type, reason, notes, promoted_by
    ) VALUES (
      student,
      (promotion_record->>'from_academic_year_id')::UUID,
      target_academic_year_id,
      from_class,
      to_class,
      promotion_record->>'promotion_type',
      promotion_record->>'reason',
      promotion_record->>'notes',
      promoted_by_user
    );

    -- Compute outstanding balance with proper GREATEST and COALESCE
    SELECT GREATEST(
      COALESCE(SUM(actual_fee), 0) - COALESCE(SUM(paid_amount), 0) - COALESCE(SUM(discount_amount), 0), 
      0
    )
    INTO outstanding_balance
    FROM public.student_fee_records
    WHERE student_id = student
      AND academic_year_id = (promotion_record->>'from_academic_year_id')::UUID
      AND status != 'Paid';

    IF promotion_record->>'promotion_type' = 'promoted' THEN
      UPDATE public.students SET class_id = to_class, updated_at = now() WHERE id = student;
      v_promoted_count := v_promoted_count + 1;

      -- Insert class fee rows ONLY for TARGET year with ON CONFLICT DO NOTHING
      FOR fee_structures IN 
        SELECT * FROM public.fee_structures 
        WHERE academic_year_id = target_academic_year_id AND class_id = to_class AND is_active = true
      LOOP
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status
        ) VALUES (
          student, to_class, target_academic_year_id, fee_structures.fee_type, fee_structures.amount, 0, 0,
          CURRENT_DATE + INTERVAL '30 days', 'Pending'
        )
        ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        
        IF FOUND THEN
          v_fee_rows_created := v_fee_rows_created + 1;
        END IF;
      END LOOP;

      -- Insert PYD row in TARGET year if outstanding > 0
      IF outstanding_balance > 0 THEN
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status, is_carry_forward, priority_order
        ) VALUES (
          student, to_class, target_academic_year_id, 'Previous Year Dues',
          outstanding_balance, 0, 0, CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
        )
        ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        
        IF FOUND THEN
          v_pyd_rows_created := v_pyd_rows_created + 1;
        END IF;
      END IF;

    ELSIF promotion_record->>'promotion_type' = 'repeated' THEN
      -- Insert class fees for TARGET year (repeated class)
      FOR fee_structures IN 
        SELECT * FROM public.fee_structures 
        WHERE academic_year_id = target_academic_year_id AND class_id = from_class AND is_active = true
      LOOP
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status
        ) VALUES (
          student, from_class, target_academic_year_id, fee_structures.fee_type, fee_structures.amount, 0, 0,
          CURRENT_DATE + INTERVAL '30 days', 'Pending'
        )
        ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        
        IF FOUND THEN
          v_fee_rows_created := v_fee_rows_created + 1;
        END IF;
      END LOOP;

      -- Insert PYD row in TARGET year if outstanding > 0
      IF outstanding_balance > 0 THEN
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status, is_carry_forward, priority_order
        ) VALUES (
          student, from_class, target_academic_year_id, 'Previous Year Dues',
          outstanding_balance, 0, 0, CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
        )
        ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        
        IF FOUND THEN
          v_pyd_rows_created := v_pyd_rows_created + 1;
        END IF;
      END IF;

      result_json := jsonb_set(result_json, '{repeated}', ((result_json->>'repeated')::INT + 1)::TEXT::JSONB);

    ELSE -- dropout
      IF outstanding_balance > 0 THEN
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status, is_carry_forward, priority_order
        ) VALUES (
          student, from_class, target_academic_year_id, 'Previous Year Dues',
          outstanding_balance, 0, 0, CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
        )
        ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        
        IF FOUND THEN
          v_pyd_rows_created := v_pyd_rows_created + 1;
        END IF;
      END IF;

      UPDATE public.students SET status = 'Inactive', updated_at = now() WHERE id = student;
      result_json := jsonb_set(result_json, '{dropouts}', ((result_json->>'dropouts')::INT + 1)::TEXT::JSONB);
    END IF;

    INSERT INTO public.promotion_audit (
      request_id, student_id, from_academic_year_id, to_academic_year_id, from_class_id, to_class_id,
      promotion_type, reason, notes, promoted_by
    ) VALUES (
      req_id, student, (promotion_record->>'from_academic_year_id')::UUID, target_academic_year_id,
      from_class, to_class, promotion_record->>'promotion_type', promotion_record->>'reason', promotion_record->>'notes', promoted_by_user
    );

    INSERT INTO public.promotion_events (event_type, payload, request_id)
    VALUES (
      'promotion.completed',
      jsonb_build_object(
        'student_id', student,
        'from_year', (promotion_record->>'from_academic_year_id')::UUID,
        'to_year', target_academic_year_id,
        'from_class', from_class,
        'to_class', to_class,
        'promotion_type', promotion_record->>'promotion_type',
        'version', 1
      ),
      req_id
    );

    INSERT INTO public.cache_invalidations (student_id, academic_year_id, cache_key, reason)
    VALUES
      (student, (promotion_record->>'from_academic_year_id')::UUID, student::TEXT || ':' || (promotion_record->>'from_academic_year_id'), 'promotion'),
      (student, target_academic_year_id, student::TEXT || ':' || target_academic_year_id::TEXT, 'promotion');
  END LOOP;

  -- CAPTURE SOURCE-YEAR SNAPSHOT AFTER WRITES AND GUARD
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(actual_fee), 0),
    COALESCE(SUM(paid_amount), 0)
  INTO 
    source_count_after,
    source_sum_actual_after, 
    source_sum_paid_after
  FROM public.student_fee_records sfr
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(promotion_data) AS p(item)
    WHERE (p.item->>'from_academic_year_id')::UUID = sfr.academic_year_id
      AND (p.item->>'student_id')::UUID = sfr.student_id
  );

  RAISE NOTICE '[PROMOTE-RPC] Source snapshot AFTER: count=%, actual=%, paid=%', 
    source_count_after, source_sum_actual_after, source_sum_paid_after;

  -- HARDENED GUARD: Source year rows must be immutable (except for balance recalc)
  IF source_count_after != source_count_before 
     OR source_sum_actual_after != source_sum_actual_before 
     OR source_sum_paid_after != source_sum_paid_before THEN
    RAISE EXCEPTION 'GUARD_VIOLATION: Source year data was modified! Before: count=%, actual=%, paid=% | After: count=%, actual=%, paid=%', 
      source_count_before, source_sum_actual_before, source_sum_paid_before,
      source_count_after, source_sum_actual_after, source_sum_paid_after;
  END IF;

  result_json := jsonb_set(result_json, '{promoted}', v_promoted_count::TEXT::JSONB);
  result_json := jsonb_set(result_json, '{fee_rows_created}', v_fee_rows_created::TEXT::JSONB);
  result_json := jsonb_set(result_json, '{pyd_rows_created}', v_pyd_rows_created::TEXT::JSONB);

  UPDATE public.promotion_requests
  SET status = 'completed', result = result_json, completed_at = now()
  WHERE id = req_id;

  RETURN result_json;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.promotion_requests
  SET status = 'failed', error = SQLERRM, completed_at = now()
  WHERE id = req_id;
  RAISE;
END;
$function$;

-- 2. Safer data-fix migration with precise targeting
WITH to_delete AS (
  SELECT sfr.id
  FROM public.student_fee_records sfr
  JOIN public.student_promotions sp ON (
    sfr.student_id = sp.student_id 
    AND sfr.academic_year_id = sp.from_academic_year_id
  )
  JOIN public.fee_structures fs ON (
    fs.academic_year_id = sp.to_academic_year_id
    AND fs.class_id = sp.to_class_id
    AND fs.fee_type = sfr.fee_type
  )
  WHERE sfr.fee_type != 'Previous Year Dues'
    AND sfr.paid_amount = 0
    AND sfr.created_at >= sp.created_at
)
DELETE FROM public.student_fee_records
WHERE id IN (SELECT id FROM to_delete);

-- 3. Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fee_records_year 
ON public.student_fee_records (academic_year_id, student_id);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS u_fee_records_comp 
ON public.student_fee_records (student_id, class_id, academic_year_id, fee_type);