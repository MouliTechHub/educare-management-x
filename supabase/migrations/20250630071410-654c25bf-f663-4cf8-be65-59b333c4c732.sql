
-- Update students table for Indian caste categories and required fields
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS date_of_join DATE NOT NULL DEFAULT CURRENT_DATE;

-- Update caste_category constraint to include all Indian categories
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_caste_category_check;

ALTER TABLE public.students 
ADD CONSTRAINT students_caste_category_check 
CHECK (caste_category IN ('SC', 'ST', 'OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'EWS'));

-- Make class_id required for students (remove nullable)
ALTER TABLE public.students 
ALTER COLUMN class_id SET NOT NULL;

-- Add Aadhaar validation for students (12 digits)
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_aadhaar_check;

ALTER TABLE public.students 
ADD CONSTRAINT students_aadhaar_check 
CHECK (aadhaar_number IS NULL OR (aadhaar_number ~ '^[0-9]{12}$'));

-- Add Aadhaar number for teachers as required field
ALTER TABLE public.teachers 
ALTER COLUMN aadhaar_number SET NOT NULL;

ALTER TABLE public.teachers 
ADD CONSTRAINT teachers_aadhaar_check 
CHECK (aadhaar_number ~ '^[0-9]{12}$');

-- Create comprehensive fee structures table (replacing the old one)
DROP TABLE IF EXISTS public.fee_structures CASCADE;

CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('Tuition', 'Transport', 'Meals', 'Books', 'Uniform', 'Activities', 'Laboratory', 'Library', 'Sports', 'Other')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('Monthly', 'Quarterly', 'Annually', 'One Time')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, academic_year_id, fee_type)
);

-- Create payments table for structured payment tracking
CREATE TABLE IF NOT EXISTS public.student_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL CHECK (amount_paid > 0),
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('PhonePe', 'GPay', 'Card', 'Online', 'Cash', 'Cheque', 'Bank Transfer')),
  late_fee NUMERIC DEFAULT 0 CHECK (late_fee >= 0),
  reference_number TEXT,
  payment_received_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student fee assignments table
CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  paid_amount NUMERIC NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  balance_amount NUMERIC GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, fee_structure_id)
);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fee_structures_updated_at ON public.fee_structures;
CREATE TRIGGER update_fee_structures_updated_at
    BEFORE UPDATE ON public.fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_payments_updated_at ON public.student_payments;
CREATE TRIGGER update_student_payments_updated_at
    BEFORE UPDATE ON public.student_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_fee_assignments_updated_at ON public.student_fee_assignments;
CREATE TRIGGER update_student_fee_assignments_updated_at
    BEFORE UPDATE ON public.student_fee_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update paid amounts when payments are made
CREATE OR REPLACE FUNCTION update_student_fee_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the paid amount in student_fee_assignments
    UPDATE public.student_fee_assignments 
    SET paid_amount = COALESCE((
        SELECT SUM(amount_paid) 
        FROM public.student_payments 
        WHERE student_id = NEW.student_id 
        AND fee_structure_id = NEW.fee_structure_id
    ), 0)
    WHERE student_id = NEW.student_id 
    AND fee_structure_id = NEW.fee_structure_id;
    
    -- Update status based on balance
    UPDATE public.student_fee_assignments 
    SET status = CASE 
        WHEN balance_amount = 0 THEN 'Paid'
        WHEN balance_amount < total_amount THEN 'Partial'
        WHEN due_date < CURRENT_DATE AND balance_amount > 0 THEN 'Overdue'
        ELSE 'Pending'
    END
    WHERE student_id = NEW.student_id 
    AND fee_structure_id = NEW.fee_structure_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balances after payment
DROP TRIGGER IF EXISTS trigger_update_fee_balance ON public.student_payments;
CREATE TRIGGER trigger_update_fee_balance
    AFTER INSERT OR UPDATE ON public.student_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_student_fee_balance();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_year ON public.fee_structures(class_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_student_fee ON public.student_payments(student_id, fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student ON public.student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);

-- Add view for class gender statistics
CREATE OR REPLACE VIEW public.class_gender_stats AS
SELECT 
    c.id,
    c.name,
    c.section,
    COUNT(s.id) as total_students,
    COUNT(CASE WHEN s.gender = 'Male' THEN 1 END) as male_count,
    COUNT(CASE WHEN s.gender = 'Female' THEN 1 END) as female_count,
    COUNT(CASE WHEN s.gender = 'Other' THEN 1 END) as other_count
FROM public.classes c
LEFT JOIN public.students s ON c.id = s.class_id AND s.status = 'Active'
GROUP BY c.id, c.name, c.section
ORDER BY c.name, c.section;
