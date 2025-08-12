-- 1) Promotion requests table for idempotency
CREATE TABLE IF NOT EXISTS public.promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  request_payload JSONB NOT NULL,
  target_academic_year_id UUID NOT NULL,
  promoted_by_user TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS and restrict to admins
ALTER TABLE public.promotion_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_requests' AND policyname = 'Admins manage promotion_requests'
  ) THEN
    CREATE POLICY "Admins manage promotion_requests"
    ON public.promotion_requests
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- 2) Promotion audit table
CREATE TABLE IF NOT EXISTS public.promotion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.promotion_requests(id) ON DELETE SET NULL,
  student_id UUID NOT NULL,
  from_academic_year_id UUID NOT NULL,
  to_academic_year_id UUID NOT NULL,
  from_class_id UUID NOT NULL,
  to_class_id UUID,
  promotion_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  promoted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_audit ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_audit' AND policyname = 'Admins view promotion_audit'
  ) THEN
    CREATE POLICY "Admins view promotion_audit"
    ON public.promotion_audit
    FOR SELECT
    USING (is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_audit' AND policyname = 'Only system can modify promotion_audit'
  ) THEN
    CREATE POLICY "Only system can modify promotion_audit"
    ON public.promotion_audit
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- 3) Domain events table for promotions
CREATE TABLE IF NOT EXISTS public.promotion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id UUID REFERENCES public.promotion_requests(id) ON DELETE SET NULL
);

ALTER TABLE public.promotion_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_events' AND policyname = 'Admins view promotion_events'
  ) THEN
    CREATE POLICY "Admins view promotion_events"
    ON public.promotion_events
    FOR SELECT
    USING (is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_events' AND policyname = 'Only system can modify promotion_events'
  ) THEN
    CREATE POLICY "Only system can modify promotion_events"
    ON public.promotion_events
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- Realtime support
ALTER TABLE public.promotion_events REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.promotion_events';
  END IF;
END $$;

-- 4) Cache invalidations table
CREATE TABLE IF NOT EXISTS public.cache_invalidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  academic_year_id UUID NOT NULL,
  cache_key TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cache_invalidations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cache_invalidations' AND policyname = 'Admins view cache_invalidations'
  ) THEN
    CREATE POLICY "Admins view cache_invalidations"
    ON public.cache_invalidations
    FOR SELECT
    USING (is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cache_invalidations' AND policyname = 'Only system can modify cache_invalidations'
  ) THEN
    CREATE POLICY "Only system can modify cache_invalidations"
    ON public.cache_invalidations
    FOR ALL
    TO public
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cache_invalidations_student_year ON public.cache_invalidations(student_id, academic_year_id);
ALTER TABLE public.cache_invalidations REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.cache_invalidations';
  END IF;
END $$;

-- 5) Helper to compute next class by name/section progression
CREATE OR REPLACE FUNCTION public.get_next_class_id(current_class_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_name TEXT;
  current_section TEXT;
  current_number INT;
  next_number INT;
  next_name TEXT;
  next_class_id UUID;
BEGIN
  SELECT name, section INTO current_name, current_section
  FROM public.classes WHERE id = current_class_id;

  IF current_name IS NULL THEN
    RETURN current_class_id;
  END IF;

  current_number := NULLIF(regexp_replace(current_name, '\\D', '', 'g'), '')::INT;
  IF current_number IS NULL THEN
    RETURN current_class_id;
  END IF;

  next_number := current_number + 1;
  next_name := regexp_replace(current_name, '\\d+', next_number::TEXT);

  SELECT id INTO next_class_id
  FROM public.classes
  WHERE name = next_name AND COALESCE(section, '') = COALESCE(current_section, '')
  LIMIT 1;

  RETURN COALESCE(next_class_id, current_class_id);
END;
$$;

-- 6) Atomic, idempotent promotion function (extends existing signature)
CREATE OR REPLACE FUNCTION public.promote_students_with_fees(
  promotion_data jsonb,
  target_academic_year_id uuid,
  promoted_by_user text,
  idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  req_id UUID;
  computed_key TEXT;
  existing_result JSONB;
  existing_status TEXT;
  promotion_record JSONB;
  fee_structures RECORD;
  outstanding_balance NUMERIC;
  from_class UUID;
  to_class UUID;
  student UUID;
  result JSONB := '{"promoted": 0, "repeated": 0, "dropouts": 0, "errors": []}'::JSONB;
BEGIN
  -- Idempotency: compute key and short-circuit if already done or in-flight
  computed_key := COALESCE(idempotency_key, md5(promotion_data::TEXT || target_academic_year_id::TEXT || promoted_by_user));
  SELECT id, result, status INTO req_id, existing_result, existing_status
  FROM public.promotion_requests WHERE idempotency_key = computed_key;

  IF existing_status = 'completed' THEN
    RETURN existing_result;
  ELSIF existing_status = 'processing' THEN
    RAISE EXCEPTION 'request_in_progress';
  END IF;

  INSERT INTO public.promotion_requests(idempotency_key, request_payload, target_academic_year_id, promoted_by_user, status)
  VALUES (computed_key, promotion_data, target_academic_year_id, promoted_by_user, 'processing')
  RETURNING id INTO req_id;

  -- Process promotions atomically (function runs in single transaction)
  FOR promotion_record IN SELECT * FROM jsonb_array_elements(promotion_data)
  LOOP
    student := (promotion_record->>'student_id')::UUID;
    from_class := (promotion_record->>'from_class_id')::UUID;

    -- Canonical target class
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

    -- Record promotion
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

    -- Outstanding balance
    SELECT COALESCE(SUM(GREATEST(final_fee - paid_amount, 0)), 0)
    INTO outstanding_balance
    FROM public.student_fee_records
    WHERE student_id = student
      AND academic_year_id = (promotion_record->>'from_academic_year_id')::UUID
      AND status != 'Paid';

    -- Apply promotion type effects
    IF promotion_record->>'promotion_type' = 'promoted' THEN
      UPDATE public.students SET class_id = to_class, updated_at = now() WHERE id = student;

      IF outstanding_balance > 0 THEN
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status, is_carry_forward, priority_order
        ) VALUES (
          student, to_class, target_academic_year_id, 'Previous Year Dues',
          outstanding_balance, 0, 0, CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
        );
      END IF;

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
      END LOOP;

      result := jsonb_set(result, '{promoted}', ((result->>'promoted')::INT + 1)::TEXT::JSONB);

    ELSIF promotion_record->>'promotion_type' = 'repeated' THEN
      IF outstanding_balance > 0 THEN
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status, is_carry_forward, priority_order
        ) VALUES (
          student, from_class, target_academic_year_id, 'Previous Year Dues',
          outstanding_balance, 0, 0, CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
        );
      END IF;

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
      END LOOP;

      result := jsonb_set(result, '{repeated}', ((result->>'repeated')::INT + 1)::TEXT::JSONB);

    ELSE
      IF outstanding_balance > 0 THEN
        INSERT INTO public.student_fee_records (
          student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, due_date, status, is_carry_forward, priority_order
        ) VALUES (
          student, from_class, target_academic_year_id, 'Previous Year Dues',
          outstanding_balance, 0, 0, CURRENT_DATE + INTERVAL '15 days', 'Pending', true, 1
        );
      END IF;

      UPDATE public.students SET status = 'Inactive', updated_at = now() WHERE id = student;

      result := jsonb_set(result, '{dropouts}', ((result->>'dropouts')::INT + 1)::TEXT::JSONB);
    END IF;

    -- Audit entry
    INSERT INTO public.promotion_audit (
      request_id, student_id, from_academic_year_id, to_academic_year_id, from_class_id, to_class_id,
      promotion_type, reason, notes, promoted_by
    ) VALUES (
      req_id, student, (promotion_record->>'from_academic_year_id')::UUID, target_academic_year_id,
      from_class, to_class, promotion_record->>'promotion_type', promotion_record->>'reason', promotion_record->>'notes', promoted_by_user
    );

    -- Domain event
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

    -- Cache invalidations for both years
    INSERT INTO public.cache_invalidations (student_id, academic_year_id, cache_key, reason)
    VALUES
      (student, (promotion_record->>'from_academic_year_id')::UUID, student::TEXT || ':' || (promotion_record->>'from_academic_year_id'), 'promotion'),
      (student, target_academic_year_id, student::TEXT || ':' || target_academic_year_id::TEXT, 'promotion');

  END LOOP;

  UPDATE public.promotion_requests
  SET status = 'completed', result = result, completed_at = now()
  WHERE id = req_id;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.promotion_requests
  SET status = 'failed', error = SQLERRM, completed_at = now()
  WHERE id = req_id;
  RAISE;
END;
$$;