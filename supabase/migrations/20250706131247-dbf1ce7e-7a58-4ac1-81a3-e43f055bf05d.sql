-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_assign_tuition_fee ON public.students;
DROP TRIGGER IF EXISTS trigger_update_fee_record_on_payment ON public.fee_payment_records;
DROP TRIGGER IF EXISTS trigger_calculate_fee_amounts ON public.student_fee_records;

-- Create trigger to auto-assign tuition fees when students are added
CREATE TRIGGER trigger_auto_assign_tuition_fee
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tuition_fee();

-- Create trigger to update fee records when payments are made
CREATE TRIGGER trigger_update_fee_record_on_payment
  AFTER INSERT OR UPDATE ON public.fee_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fee_record_on_payment();

-- Add calculated columns function to keep data in sync
CREATE OR REPLACE FUNCTION public.calculate_fee_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate final_fee and balance_fee
  NEW.final_fee = NEW.actual_fee - NEW.discount_amount;
  NEW.balance_fee = NEW.final_fee - NEW.paid_amount;
  
  -- Update status based on payment
  IF NEW.balance_fee <= 0 THEN
    NEW.status = 'Paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status = 'Partial';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'Overdue';
  ELSE
    NEW.status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calculations
CREATE TRIGGER trigger_calculate_fee_amounts
  BEFORE INSERT OR UPDATE ON public.student_fee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fee_amounts();