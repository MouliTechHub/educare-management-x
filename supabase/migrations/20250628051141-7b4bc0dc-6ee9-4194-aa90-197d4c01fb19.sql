
-- Create academic_years table to track school years
CREATE TABLE public.academic_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year_name TEXT NOT NULL UNIQUE, -- e.g., "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_academic_records table to track student progression by year
CREATE TABLE public.student_academic_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  class_id UUID REFERENCES public.classes(id),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Graduated', 'Left', 'Transferred')),
  enrollment_date DATE,
  departure_date DATE,
  departure_reason TEXT,
  promoted_from_class UUID REFERENCES public.classes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

-- Add academic year tracking to fees table
ALTER TABLE public.fees ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id);
ALTER TABLE public.fees ADD COLUMN total_paid NUMERIC NOT NULL DEFAULT 0;

-- Add indexes for performance
CREATE INDEX idx_fees_academic_year ON public.fees(academic_year_id);
CREATE INDEX idx_student_academic_records_student_year ON public.student_academic_records(student_id, academic_year_id);
CREATE INDEX idx_student_academic_records_year ON public.student_academic_records(academic_year_id);

-- Insert default academic year for existing data
INSERT INTO public.academic_years (year_name, start_date, end_date, is_current) 
VALUES ('2024-2025', '2024-04-01', '2025-03-31', TRUE);

-- Update existing fees to use the current academic year
UPDATE public.fees 
SET academic_year_id = (SELECT id FROM public.academic_years WHERE is_current = TRUE LIMIT 1)
WHERE academic_year_id IS NULL;

-- Make academic_year_id required after setting default values
ALTER TABLE public.fees ALTER COLUMN academic_year_id SET NOT NULL;

-- Create student academic records for existing students
INSERT INTO public.student_academic_records (student_id, academic_year_id, class_id, status, enrollment_date)
SELECT 
  s.id,
  (SELECT id FROM public.academic_years WHERE is_current = TRUE LIMIT 1),
  s.class_id,
  CASE 
    WHEN s.status = 'Active' THEN 'Active'
    WHEN s.status = 'Alumni' THEN 'Graduated'
    ELSE 'Left'
  END,
  s.created_at::DATE
FROM public.students s
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_academic_records sar 
  WHERE sar.student_id = s.id 
  AND sar.academic_year_id = (SELECT id FROM public.academic_years WHERE is_current = TRUE LIMIT 1)
);

-- Update payment_history to calculate total_paid for each fee
UPDATE public.fees 
SET total_paid = COALESCE((
  SELECT SUM(ph.amount_paid) 
  FROM public.payment_history ph 
  WHERE ph.fee_id = fees.id
), 0);

-- Add triggers to keep updated_at current
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_academic_years_updated_at 
  BEFORE UPDATE ON public.academic_years 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_academic_records_updated_at 
  BEFORE UPDATE ON public.student_academic_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update total_paid when payment_history changes
CREATE OR REPLACE FUNCTION update_fee_total_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the total_paid for the affected fee
  UPDATE public.fees 
  SET total_paid = COALESCE((
    SELECT SUM(ph.amount_paid) 
    FROM public.payment_history ph 
    WHERE ph.fee_id = COALESCE(NEW.fee_id, OLD.fee_id)
  ), 0)
  WHERE id = COALESCE(NEW.fee_id, OLD.fee_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fee_total_paid_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION update_fee_total_paid();
