
-- Create payment_reversals table to track reversed/refunded payments
CREATE TABLE public.payment_reversals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_history_id UUID NOT NULL,
  reversal_type TEXT NOT NULL CHECK (reversal_type IN ('reversal', 'refund')),
  reversal_amount NUMERIC NOT NULL,
  reversal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  notes TEXT,
  authorized_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for payment reversals
ALTER TABLE public.payment_reversals ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing payment reversals
CREATE POLICY "Allow all to view payment reversals" 
  ON public.payment_reversals 
  FOR SELECT 
  TO public 
  USING (true);

-- Create policy for inserting payment reversals
CREATE POLICY "Allow all to create payment reversals" 
  ON public.payment_reversals 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Add trigger for updated_at column
CREATE TRIGGER update_payment_reversals_updated_at
  BEFORE UPDATE ON public.payment_reversals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
