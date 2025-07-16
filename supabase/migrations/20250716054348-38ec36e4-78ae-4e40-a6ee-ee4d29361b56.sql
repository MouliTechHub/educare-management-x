-- Create trigger for payment allocation when payment records are inserted
CREATE OR REPLACE TRIGGER trigger_payment_allocation
  AFTER INSERT ON public.fee_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_payment_allocation_trigger();