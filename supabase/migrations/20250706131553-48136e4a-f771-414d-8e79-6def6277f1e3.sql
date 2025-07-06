-- Enable RLS for student_fee_records table and create policies
ALTER TABLE public.student_fee_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_fee_records
CREATE POLICY "Allow all for authenticated users student_fee_records"
  ON public.student_fee_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Test discount functionality
UPDATE public.student_fee_records 
SET 
  discount_amount = 2000,
  discount_notes = 'Test discount',
  discount_updated_by = 'Test Admin',
  discount_updated_at = NOW()
WHERE id = (SELECT id FROM public.student_fee_records LIMIT 1);

-- Test another payment to make it partial
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
  3000,
  CURRENT_DATE,
  'PhonePe',
  'TEST-002',
  'Test Admin',
  'Second test payment',
  'System Test'
FROM public.student_fee_records sfr 
LIMIT 1;