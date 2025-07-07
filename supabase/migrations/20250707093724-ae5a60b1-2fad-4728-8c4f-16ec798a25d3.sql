-- Phase 1: Core Logic Functions and Triggers (Fixed)

-- Function to log fee audit actions (fixed parameter order)
CREATE OR REPLACE FUNCTION public.log_fee_audit(
  p_student_id UUID,
  p_fee_record_id UUID,
  p_action_type TEXT,
  p_academic_year_id UUID,
  p_performed_by TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_amount_affected NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.fee_audit_log (
    student_id, fee_record_id, action_type, old_values, new_values,
    amount_affected, academic_year_id, performed_by, notes, reference_number
  )
  VALUES (
    p_student_id, p_fee_record_id, p_action_type, p_old_values, p_new_values,
    p_amount_affected, p_academic_year_id, p_performed_by, p_notes, p_reference_number
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Enhanced payment allocation function with FIFO logic
CREATE OR REPLACE FUNCTION public.allocate_payment_fifo(
  p_student_id UUID,
  p_payment_amount NUMERIC,
  p_payment_record_id UUID,
  p_academic_year_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
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
    
    -- Update the fee record
    UPDATE public.student_fee_records
    SET 
      paid_amount = paid_amount + allocated_amount,
      balance_fee = balance_fee - allocated_amount,
      status = CASE 
        WHEN (balance_fee - allocated_amount) <= 0 THEN 'Paid'
        WHEN paid_amount > 0 THEN 'Partial'
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
$$;

-- Function to carry forward outstanding fees
CREATE OR REPLACE FUNCTION public.carry_forward_student_fees(
  p_student_id UUID,
  p_from_academic_year_id UUID,
  p_to_academic_year_id UUID,
  p_carry_forward_type TEXT DEFAULT 'automatic',
  p_created_by TEXT DEFAULT 'System'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  outstanding_amount NUMERIC := 0;
  carry_forward_id UUID;
  new_fee_record_id UUID;
  student_class_id UUID;
  result JSONB;
BEGIN
  -- Get student's current class
  SELECT class_id INTO student_class_id 
  FROM public.students 
  WHERE id = p_student_id;
  
  -- Calculate total outstanding amount
  SELECT COALESCE(SUM(balance_fee), 0) INTO outstanding_amount
  FROM public.student_fee_records
  WHERE student_id = p_student_id
    AND academic_year_id = p_from_academic_year_id
    AND balance_fee > 0
    AND status != 'Paid';
  
  -- Only proceed if there are outstanding amounts
  IF outstanding_amount > 0 THEN
    -- Create carry forward record
    INSERT INTO public.fee_carry_forward (
      student_id,
      from_academic_year_id,
      to_academic_year_id,
      original_amount,
      carried_amount,
      carry_forward_type,
      created_by
    )
    VALUES (
      p_student_id,
      p_from_academic_year_id,
      p_to_academic_year_id,
      outstanding_amount,
      outstanding_amount,
      p_carry_forward_type,
      p_created_by
    )
    RETURNING id INTO carry_forward_id;
    
    -- Create new fee record in target academic year
    INSERT INTO public.student_fee_records (
      student_id,
      class_id,
      academic_year_id,
      fee_type,
      actual_fee,
      discount_amount,
      paid_amount,
      due_date,
      status,
      is_carry_forward,
      carry_forward_source_id,
      priority_order
    )
    VALUES (
      p_student_id,
      student_class_id,
      p_to_academic_year_id,
      'Previous Year Dues',
      outstanding_amount,
      0,
      0,
      CURRENT_DATE + INTERVAL '15 days',
      'Pending',
      true,
      carry_forward_id,
      1 -- Highest priority
    )
    RETURNING id INTO new_fee_record_id;
    
    -- Log the carry forward action
    PERFORM public.log_fee_audit(
      p_student_id,
      new_fee_record_id,
      'carry_forward',
      p_to_academic_year_id,
      p_created_by,
      jsonb_build_object('previous_year_outstanding', outstanding_amount),
      jsonb_build_object('carried_forward_amount', outstanding_amount),
      outstanding_amount,
      'Automatic carry forward of outstanding fees',
      carry_forward_id::TEXT
    );
    
    result := jsonb_build_object(
      'success', true,
      'carry_forward_id', carry_forward_id,
      'new_fee_record_id', new_fee_record_id,
      'outstanding_amount', outstanding_amount,
      'message', 'Outstanding fees carried forward successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'No outstanding fees to carry forward'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Enhanced payment trigger that uses FIFO allocation
CREATE OR REPLACE FUNCTION public.enhanced_payment_allocation_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  allocation_result JSONB;
  current_year_id UUID;
BEGIN
  -- Get current academic year
  SELECT id INTO current_year_id 
  FROM public.academic_years 
  WHERE is_current = true 
  LIMIT 1;
  
  -- Allocate payment using FIFO logic
  SELECT public.allocate_payment_fifo(
    NEW.student_id,
    NEW.amount_paid,
    NEW.id,
    COALESCE(current_year_id, NEW.fee_record_id)
  ) INTO allocation_result;
  
  -- Log the payment action
  PERFORM public.log_fee_audit(
    NEW.student_id,
    NEW.fee_record_id,
    'payment',
    COALESCE(current_year_id, NEW.fee_record_id),
    NEW.created_by,
    NULL,
    jsonb_build_object(
      'amount_paid', NEW.amount_paid,
      'payment_method', NEW.payment_method,
      'allocation_result', allocation_result
    ),
    NEW.amount_paid,
    NEW.notes,
    NEW.receipt_number
  );
  
  RETURN NEW;
END;
$$;

-- Replace the existing payment trigger with enhanced version
DROP TRIGGER IF EXISTS trigger_update_fee_record_on_payment ON public.fee_payment_records;
CREATE TRIGGER trigger_enhanced_payment_allocation
  AFTER INSERT ON public.fee_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_payment_allocation_trigger();

-- Function to update fee priorities based on due dates
CREATE OR REPLACE FUNCTION public.update_fee_priorities()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.student_fee_records 
  SET priority_order = CASE 
    WHEN fee_type = 'Previous Year Dues' THEN 1
    WHEN due_date < CURRENT_DATE THEN 2 -- Overdue
    ELSE 3 -- Current/Future
  END
  WHERE priority_order IS NULL OR priority_order != CASE 
    WHEN fee_type = 'Previous Year Dues' THEN 1
    WHEN due_date < CURRENT_DATE THEN 2
    ELSE 3
  END;
END;
$$;

-- Trigger to automatically update priority when fee records are modified
CREATE OR REPLACE FUNCTION public.auto_update_fee_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.priority_order := CASE 
    WHEN NEW.fee_type = 'Previous Year Dues' THEN 1
    WHEN NEW.due_date < CURRENT_DATE THEN 2
    ELSE 3
  END;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_update_fee_priority
  BEFORE INSERT OR UPDATE ON public.student_fee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_fee_priority();

-- Run initial priority update
SELECT public.update_fee_priorities();