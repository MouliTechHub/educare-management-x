-- Create trigger for payment allocation when payment records are inserted
-- This trigger will automatically call the FIFO allocation function

-- First, drop the trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_payment_allocation ON public.fee_payment_records;

-- Create the trigger that calls our enhanced payment allocation function
CREATE TRIGGER trigger_payment_allocation
  AFTER INSERT ON public.fee_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_payment_allocation_trigger();

-- Test that the function exists and works
SELECT public.enhanced_payment_allocation_trigger();