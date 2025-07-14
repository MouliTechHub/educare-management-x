-- Add a target_academic_year_id column to fee_payment_records to track which academic year the payment is targeting
ALTER TABLE public.fee_payment_records 
ADD COLUMN target_academic_year_id uuid REFERENCES public.academic_years(id);

-- Add a comment to explain the purpose
COMMENT ON COLUMN public.fee_payment_records.target_academic_year_id IS 'The academic year this payment is targeting for allocation purposes';

-- Create an index for better performance
CREATE INDEX idx_fee_payment_records_target_academic_year 
ON public.fee_payment_records(target_academic_year_id);

-- Update the enhanced payment allocation trigger to use the target academic year
CREATE OR REPLACE FUNCTION public.enhanced_payment_allocation_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  allocation_result JSONB;
  target_academic_year_id UUID;
BEGIN
  -- Use the target academic year if provided, otherwise use current academic year
  target_academic_year_id := NEW.target_academic_year_id;
  
  -- If no target academic year specified, use current academic year as fallback
  IF target_academic_year_id IS NULL THEN
    SELECT id INTO target_academic_year_id
    FROM public.academic_years 
    WHERE is_current = true 
    LIMIT 1;
  END IF;
  
  -- Allocate payment using FIFO logic with the target academic year
  SELECT public.allocate_payment_fifo(
    NEW.student_id,
    NEW.amount_paid,
    NEW.id,
    target_academic_year_id
  ) INTO allocation_result;
  
  -- Log the payment action
  PERFORM public.log_fee_audit(
    NEW.student_id,
    NEW.fee_record_id,
    'payment',
    target_academic_year_id,
    NEW.created_by,
    NULL,
    jsonb_build_object(
      'amount_paid', NEW.amount_paid,
      'payment_method', NEW.payment_method,
      'allocation_result', allocation_result,
      'target_academic_year', target_academic_year_id
    ),
    NEW.amount_paid,
    NEW.notes,
    NEW.receipt_number
  );
  
  RETURN NEW;
END;
$function$;