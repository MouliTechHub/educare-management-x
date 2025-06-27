
-- Add Aadhaar number column to students table
ALTER TABLE public.students 
ADD COLUMN aadhaar_number text;

-- Add discount tracking columns to fees table
ALTER TABLE public.fees 
ADD COLUMN actual_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN discount_notes text,
ADD COLUMN discount_updated_by text,
ADD COLUMN discount_updated_at timestamp with time zone;

-- Update existing fees to set actual_amount equal to current amount
UPDATE public.fees 
SET actual_amount = amount 
WHERE actual_amount = 0;

-- Create fee_discounts table for detailed discount tracking
CREATE TABLE public.fee_discounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_id uuid NOT NULL REFERENCES public.fees(id) ON DELETE CASCADE,
  discount_amount numeric NOT NULL,
  discount_percentage numeric,
  reason text,
  notes text,
  approved_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at column for fee_discounts
CREATE TRIGGER update_fee_discounts_updated_at 
  BEFORE UPDATE ON public.fee_discounts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_fee_discounts_fee_id ON public.fee_discounts(fee_id);
CREATE INDEX idx_fees_student_id_created_at ON public.fees(student_id, created_at);
CREATE INDEX idx_students_aadhaar_number ON public.students(aadhaar_number) WHERE aadhaar_number IS NOT NULL;
