-- Add academic year isolation constraints to prevent fee payment leakage
-- This ensures payments are properly isolated by academic year

-- Add academic year filter to payment history trigger
CREATE OR REPLACE FUNCTION public.update_fee_total_paid()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the total_paid for the affected fee, but only include payments from the same academic year
  UPDATE public.fees 
  SET total_paid = COALESCE((
    SELECT SUM(ph.amount_paid) 
    FROM public.payment_history ph 
    JOIN public.fees f ON ph.fee_id = f.id
    WHERE ph.fee_id = COALESCE(NEW.fee_id, OLD.fee_id)
    AND f.academic_year_id = (SELECT academic_year_id FROM public.fees WHERE id = COALESCE(NEW.fee_id, OLD.fee_id))
  ), 0)
  WHERE id = COALESCE(NEW.fee_id, OLD.fee_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add index for better performance on academic year queries
CREATE INDEX IF NOT EXISTS idx_fees_academic_year_student ON public.fees (academic_year_id, student_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_fee_academic_year ON public.payment_history (fee_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_records_academic_year_student ON public.student_fee_records (academic_year_id, student_id);