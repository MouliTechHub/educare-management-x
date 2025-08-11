-- 1) Add audit columns to discount_history if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'discount_history' AND column_name = 'original_academic_year_id'
  ) THEN
    ALTER TABLE public.discount_history 
      ADD COLUMN original_academic_year_id uuid NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'discount_history' AND column_name = 'target_academic_year_id'
  ) THEN
    ALTER TABLE public.discount_history 
      ADD COLUMN target_academic_year_id uuid NULL;
  END IF;
END $$;

-- 2) Ensure student_fee_records has trigger to auto-calc final_fee, balance_fee, status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_calculate_fee_amounts'
  ) THEN
    CREATE TRIGGER trg_calculate_fee_amounts
    BEFORE INSERT OR UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_fee_amounts();
  END IF;
END $$;

-- 3) Create function to apply discounts only to current-year 'Previous Year Dues'
CREATE OR REPLACE FUNCTION public.apply_previous_year_dues_discount(
  p_student_id uuid,
  p_current_year_id uuid,
  p_type text,
  p_amount numeric,
  p_reason text,
  p_notes text DEFAULT NULL,
  p_approved_by text DEFAULT 'Admin'
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
  remaining NUMERIC := 0;
  orig_year_id uuid := NULL;
  result jsonb;
BEGIN
  -- Permission check
  IF NOT public.can_manage_finances() THEN
    RAISE EXCEPTION 'insufficient_privilege: finance role required';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_discount_amount: must be > 0';
  END IF;

  -- Find only the current-year Previous Year Dues record
  SELECT * INTO rec
  FROM public.student_fee_records
  WHERE student_id = p_student_id
    AND academic_year_id = p_current_year_id
    AND fee_type = 'Previous Year Dues'
  FOR UPDATE;

  IF rec IS NULL THEN
    RAISE EXCEPTION 'no_previous_year_dues_found_for_student_in_current_year';
  END IF;

  -- Extra safety: enforce fee type
  IF rec.fee_type <> 'Previous Year Dues' THEN
    RAISE EXCEPTION 'invalid_fee_type: only Previous Year Dues can be discounted with this function';
  END IF;

  -- Compute discount to add
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

  -- Validate against remaining balance
  remaining := GREATEST((rec.actual_fee - rec.discount_amount) - rec.paid_amount, 0);
  IF add_amount > remaining THEN
    RAISE EXCEPTION 'invalid_discount_amount_exceeds_remaining: attempted % exceeds remaining %', add_amount, remaining;
  END IF;

  new_total := COALESCE(rec.discount_amount, 0) + add_amount;
  IF new_total > rec.actual_fee THEN
    RAISE EXCEPTION 'invalid_total_discount_exceeds_actual: % > %', new_total, rec.actual_fee;
  END IF;

  -- Determine original academic year
  IF rec.carry_forward_source_id IS NOT NULL THEN
    SELECT from_academic_year_id INTO orig_year_id
    FROM public.fee_carry_forward
    WHERE id = rec.carry_forward_source_id;
  END IF;

  IF orig_year_id IS NULL THEN
    -- Fallback via promotion mapping
    SELECT from_academic_year_id INTO orig_year_id
    FROM public.student_promotions
    WHERE student_id = p_student_id
      AND to_academic_year_id = p_current_year_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Apply the discount (trigger will recompute final/balance/status)
  UPDATE public.student_fee_records
  SET 
    discount_amount = new_total,
    discount_notes = p_notes,
    discount_updated_by = p_approved_by,
    discount_updated_at = now(),
    updated_at = now()
  WHERE id = rec.id;

  -- Log discount with audit columns
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
    applied_by,
    original_academic_year_id,
    target_academic_year_id
  ) VALUES (
    rec.id,
    rec.id,
    'student_fee_records',
    rec.student_id,
    add_amount,
    p_type,
    CASE WHEN p_type = 'Percentage' THEN p_amount ELSE NULL END,
    p_reason,
    p_notes,
    p_approved_by,
    orig_year_id,
    p_current_year_id
  );

  -- Build result with refreshed values
  SELECT jsonb_build_object(
    'success', true,
    'fee_record_id', rec.id,
    'added_discount', add_amount,
    'new_total_discount', new_total,
    'current_final_fee', (actual_fee - new_total),
    'current_paid_amount', paid_amount,
    'current_balance', GREATEST((actual_fee - new_total) - paid_amount, 0),
    'original_academic_year_id', orig_year_id,
    'target_academic_year_id', p_current_year_id
  ) INTO result
  FROM public.student_fee_records WHERE id = rec.id;

  RETURN result;
END;
$$;