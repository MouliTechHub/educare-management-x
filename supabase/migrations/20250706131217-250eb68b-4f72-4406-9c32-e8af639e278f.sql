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

-- Create missing fee records for existing students
WITH current_year AS (
  SELECT id FROM public.academic_years WHERE is_current = true LIMIT 1
),
student_fee_data AS (
  SELECT 
    s.id as student_id,
    s.class_id,
    fs.fee_type,
    fs.amount as actual_fee,
    cy.id as academic_year_id
  FROM public.students s
  JOIN public.fee_structures fs ON s.class_id = fs.class_id
  CROSS JOIN current_year cy
  JOIN public.academic_years ay ON fs.academic_year_id = ay.id
  WHERE s.status = 'Active' 
    AND fs.is_active = true
    AND ay.is_current = true
    AND NOT EXISTS (
      SELECT 1 FROM public.student_fee_records sfr 
      WHERE sfr.student_id = s.id 
        AND sfr.academic_year_id = cy.id 
        AND sfr.fee_type = fs.fee_type
    )
)
INSERT INTO public.student_fee_records (
  student_id,
  class_id,
  academic_year_id,
  fee_type,
  actual_fee,
  discount_amount,
  paid_amount,
  final_fee,
  balance_fee,
  due_date,
  status
)
SELECT 
  student_id,
  class_id,
  academic_year_id,
  fee_type,
  actual_fee,
  0 as discount_amount,
  0 as paid_amount,
  actual_fee as final_fee,
  actual_fee as balance_fee,
  CURRENT_DATE + INTERVAL '30 days' as due_date,
  'Pending' as status
FROM student_fee_data;

-- Add calculated columns triggers to keep data in sync
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
DROP TRIGGER IF EXISTS trigger_calculate_fee_amounts ON public.student_fee_records;
CREATE TRIGGER trigger_calculate_fee_amounts
  BEFORE INSERT OR UPDATE ON public.student_fee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fee_amounts();