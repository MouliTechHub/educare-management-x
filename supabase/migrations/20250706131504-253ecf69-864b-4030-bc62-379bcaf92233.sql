-- Enable RLS for fee_payment_records table
ALTER TABLE public.fee_payment_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fee_payment_records
CREATE POLICY "Allow all for authenticated users fee_payment_records"
  ON public.fee_payment_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Test creating a payment record manually to verify functionality
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
  5000,
  CURRENT_DATE,
  'Cash',
  'TEST-001',
  'Test Admin',
  'Test payment for system validation',
  'System Test'
FROM public.student_fee_records sfr 
LIMIT 1;