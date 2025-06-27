
-- Create payment_history table to track all payment transactions
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_id uuid NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  payment_date date NOT NULL,
  receipt_number text NOT NULL,
  payment_receiver text NOT NULL,
  payment_method text NOT NULL DEFAULT 'Cash',
  notes text,
  fee_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at column
CREATE TRIGGER update_payment_history_updated_at 
  BEFORE UPDATE ON public.payment_history 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX idx_payment_history_student_id ON public.payment_history(student_id);
CREATE INDEX idx_payment_history_fee_id ON public.payment_history(fee_id);
CREATE INDEX idx_payment_history_payment_date ON public.payment_history(payment_date);
