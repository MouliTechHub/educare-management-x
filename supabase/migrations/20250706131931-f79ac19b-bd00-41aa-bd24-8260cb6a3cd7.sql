-- Complete the final payment test  
INSERT INTO public.fee_payment_records (
  fee_record_id,
  student_id,
  amount_paid,
  payment_date,
  payment_method,
  receipt_number,
  payment_receiver,
  notes,
  created_by
) 
SELECT 
  sfr.id,
  sfr.student_id,
  sfr.balance_fee, -- Pay remaining balance (should be 9500)
  CURRENT_DATE,
  'Card',
  'TEST-003',
  'Test Admin',
  'Final payment to complete fee',
  'System Test'
FROM public.student_fee_records sfr 
LIMIT 1;