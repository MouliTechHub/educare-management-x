-- Fix the allocate_payment_fifo function to not update balance_fee directly
-- since it's a generated column that gets calculated automatically
CREATE OR REPLACE FUNCTION public.allocate_payment_fifo(p_student_id uuid, p_payment_amount numeric, p_payment_record_id uuid, p_academic_year_id uuid)
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
        ELSE 2
      END as priority_group
    FROM public.student_fee_records sfr
    JOIN public.academic_years ay ON sfr.academic_year_id = ay.id
    WHERE sfr.student_id = p_student_id
      AND sfr.balance_fee > 0
      AND sfr.status != 'Paid'
      AND NOT COALESCE(sfr.payment_blocked, false)
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