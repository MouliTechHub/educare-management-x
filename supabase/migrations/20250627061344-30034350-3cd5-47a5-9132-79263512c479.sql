
-- Create fee_structures table for Indian school fee management
CREATE TABLE public.fee_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id uuid REFERENCES public.classes(id) NOT NULL,
  tuition_fee numeric NOT NULL DEFAULT 0,
  development_fee numeric NOT NULL DEFAULT 0,
  library_fee numeric NOT NULL DEFAULT 0,
  laboratory_fee numeric NOT NULL DEFAULT 0,
  sports_fee numeric NOT NULL DEFAULT 0,
  computer_fee numeric NOT NULL DEFAULT 0,
  transport_fee numeric NOT NULL DEFAULT 0,
  hostel_fee numeric NOT NULL DEFAULT 0,
  examination_fee numeric NOT NULL DEFAULT 0,
  activity_fee numeric NOT NULL DEFAULT 0,
  uniform_fee numeric NOT NULL DEFAULT 0,
  book_fee numeric NOT NULL DEFAULT 0,
  stationary_fee numeric NOT NULL DEFAULT 0,
  medical_fee numeric NOT NULL DEFAULT 0,
  caution_deposit numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(class_id)
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_fee_structures_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
