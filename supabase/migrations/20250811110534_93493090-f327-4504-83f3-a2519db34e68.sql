-- Create transactional RPC to apply a discount and log once (no duplicate-prone client insert)
CREATE OR REPLACE FUNCTION public.apply_student_discount(
  p_fee_record_id uuid,
  p_type text,
  p_amount numeric,
  p_reason text,
  p_notes text DEFAULT NULL,
  p_applied_by text DEFAULT 'Admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec RECORD;
  add_amount NUMERIC := 0;
  new_total NUMERIC := 0;
  status_text TEXT;
BEGIN
  -- Authorization guard
  IF NOT public.can_manage_finances() THEN
    RAISE EXCEPTION 'insufficient_privilege: finance role required';
  END IF;

  -- Lock target fee record
  SELECT * INTO rec
  FROM public.student_fee_records
  WHERE id = p_fee_record_id
  FOR UPDATE;

  IF rec IS NULL THEN
    RAISE EXCEPTION 'fee record % not found', p_fee_record_id;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_discount_amount: must be > 0';
  END IF;

  -- Calculate additive discount
  IF p_type = 'Fixed Amount' THEN
    add_amount := p_amount;
  ELSIF p_type = 'Percentage' THEN
    IF p_amount > 100 THEN
      RAISE EXCEPTION 'invalid_discount_percentage: must be <= 100';
    END IF;
    add_amount := (rec.actual_fee * p_amount) / 100.0;
  ELSE
    RAISE EXCEPTION 'invalid_discount_type: %', p_type;
  END IF;

  new_total := COALESCE(rec.discount_amount, 0) + add_amount;
  IF new_total > rec.actual_fee THEN
    RAISE EXCEPTION 'invalid_total_discount: % exceeds actual fee %', new_total, rec.actual_fee;
  END IF;

  -- Recompute status based on new totals
  IF (rec.actual_fee - new_total - rec.paid_amount) <= 0 THEN
    status_text := 'Paid';
  ELSIF rec.paid_amount > 0 THEN
    status_text := 'Partial';
  ELSIF rec.due_date IS NOT NULL AND rec.due_date < CURRENT_DATE THEN
    status_text := 'Overdue';
  ELSE
    status_text := 'Pending';
  END IF;

  -- Update the fee record
  UPDATE public.student_fee_records
  SET 
    discount_amount = new_total,
    discount_notes = p_notes,
    discount_updated_by = p_applied_by,
    discount_updated_at = now(),
    final_fee = rec.actual_fee - new_total,
    balance_fee = (rec.actual_fee - new_total) - rec.paid_amount,
    status = status_text,
    updated_at = now()
  WHERE id = p_fee_record_id;

  -- Insert discount history, guard for duplicates within 5 seconds
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM public.discount_history dh
      WHERE COALESCE(dh.source_fee_id, dh.fee_id) = p_fee_record_id
        AND COALESCE(dh.student_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(rec.student_id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND dh.discount_amount = add_amount
        AND dh.applied_by = p_applied_by
        AND dh.applied_at > (now() - interval '5 seconds')
    ) THEN
      INSERT INTO public.discount_history (
        fee_id,
        source_fee_id,
        source_table,
        student_id,
        discount_amount,
        discount_type,
        discount_percentage,
        reason,
        notes,
        applied_by
      ) VALUES (
        p_fee_record_id,
        p_fee_record_id,
        'student_fee_records',
        rec.student_id,
        add_amount,
        p_type,
        CASE WHEN p_type = 'Percentage' THEN p_amount ELSE NULL END,
        p_reason,
        p_notes,
        p_applied_by
      );
    END IF;
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'fee_record_id', p_fee_record_id,
    'added_discount', add_amount,
    'new_total_discount', new_total,
    'status', status_text
  );
END;
$$;