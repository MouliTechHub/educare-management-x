-- Update the allocate_payment_fifo function to use the provided academic year for allocation
CREATE OR REPLACE FUNCTION public.allocate_payment_fifo(
  p_student_id uuid, 
  p_payment_amount numeric, 
  p_payment_record_id uuid, 
  p_academic_year_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  remaining_amount NUMERIC := p_payment_amount;
  allocation_record RECORD;
  allocation_order INTEGER := 1;
  total_allocated NUMERIC := 0;
  allocations JSONB := '[]'::JSONB;
  allocated_amount NUMERIC;
BEGIN
  -- Get all outstanding fee records for the student, ordered by priority (FIFO)
  -- Previous Year Dues first, then by due date (oldest first)
  -- Now filtering by the selected academic year for current year fees
  FOR allocation_record IN
    SELECT 
      sfr.id,
      sfr.fee_type,
      sfr.academic_year_id,
      sfr.balance_fee,
      sfr.due_date,
      ay.year_name,
      CASE 
        WHEN sfr.fee_type = 'Previous Year Dues' THEN 1
        WHEN sfr.academic_year_id = p_academic_year_id THEN 2
        ELSE 3
      END as priority_group
    FROM public.student_fee_records sfr
    JOIN public.academic_years ay ON sfr.academic_year_id = ay.id
    WHERE sfr.student_id = p_student_id
      AND sfr.balance_fee > 0
      AND sfr.status != 'Paid'
      AND NOT COALESCE(sfr.payment_blocked, false)
      AND (
        sfr.fee_type = 'Previous Year Dues' OR 
        sfr.academic_year_id = p_academic_year_id
      )
    ORDER BY 
      priority_group ASC,
      sfr.due_date ASC NULLS LAST,
      sfr.created_at ASC
  LOOP
    -- Exit if no remaining amount
    IF remaining_amount <= 0 THEN
      EXIT;
    END IF;
    
    -- Calculate allocation amount (either full balance or remaining payment)
    allocated_amount := LEAST(remaining_amount, allocation_record.balance_fee);
    
    -- Record the allocation
    INSERT INTO public.payment_allocations (
      payment_record_id,
      fee_record_id,
      allocated_amount,
      allocation_order
    )
    VALUES (
      p_payment_record_id,
      allocation_record.id,
      allocated_amount,
      allocation_order
    );
    
    -- Update the fee record - only update paid_amount, balance_fee will be calculated automatically
    UPDATE public.student_fee_records
    SET 
      paid_amount = paid_amount + allocated_amount,
      status = CASE 
        WHEN (actual_fee - discount_amount) <= (paid_amount + allocated_amount) THEN 'Paid'
        WHEN (paid_amount + allocated_amount) > 0 THEN 'Partial'
        ELSE status
      END,
      updated_at = now()
    WHERE id = allocation_record.id;
    
    -- Add to allocations result
    allocations := allocations || jsonb_build_object(
      'fee_record_id', allocation_record.id,
      'fee_type', allocation_record.fee_type,
      'academic_year', allocation_record.year_name,
      'allocated_amount', allocated_amount,
      'remaining_balance', allocation_record.balance_fee - allocated_amount
    );
    
    -- Update counters
    remaining_amount := remaining_amount - allocated_amount;
    total_allocated := total_allocated + allocated_amount;
    allocation_order := allocation_order + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_allocated', total_allocated,
    'remaining_amount', remaining_amount,
    'allocations', allocations
  );
END;
$function$;

-- Update the enhanced payment allocation trigger to pass the academic year from the payment
CREATE OR REPLACE FUNCTION public.enhanced_payment_allocation_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  allocation_result JSONB;
  selected_academic_year_id UUID;
BEGIN
  -- Try to get academic year from payment context or use current academic year as fallback
  SELECT id INTO selected_academic_year_id
  FROM public.academic_years 
  WHERE is_current = true 
  LIMIT 1;
  
  -- If we have a fee_record_id, get the academic year from that record
  IF NEW.fee_record_id IS NOT NULL THEN
    SELECT academic_year_id INTO selected_academic_year_id
    FROM public.student_fee_records
    WHERE id = NEW.fee_record_id;
  END IF;
  
  -- Allocate payment using FIFO logic with the determined academic year
  SELECT public.allocate_payment_fifo(
    NEW.student_id,
    NEW.amount_paid,
    NEW.id,
    selected_academic_year_id
  ) INTO allocation_result;
  
  -- Log the payment action
  PERFORM public.log_fee_audit(
    NEW.student_id,
    NEW.fee_record_id,
    'payment',
    selected_academic_year_id,
    NEW.created_by,
    NULL,
    jsonb_build_object(
      'amount_paid', NEW.amount_paid,
      'payment_method', NEW.payment_method,
      'allocation_result', allocation_result,
      'target_academic_year', selected_academic_year_id
    ),
    NEW.amount_paid,
    NEW.notes,
    NEW.receipt_number
  );
  
  RETURN NEW;
END;
$function$;