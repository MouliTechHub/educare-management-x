
-- Add missing columns to fee_structures table if they don't exist
ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS fee_type TEXT;

ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS amount NUMERIC;

ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS frequency TEXT;

ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add academic_year_id column with foreign key reference
ALTER TABLE public.fee_structures 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;

-- Add constraints after columns exist
DO $$
BEGIN
    -- Add check constraint for fee_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_fee_type_check'
    ) THEN
        ALTER TABLE public.fee_structures 
        ADD CONSTRAINT fee_structures_fee_type_check 
        CHECK (fee_type IN ('Tuition', 'Transport', 'Meals', 'Books', 'Uniform', 'Activities', 'Laboratory', 'Library', 'Sports', 'Other'));
    END IF;

    -- Add check constraint for amount if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_amount_check'
    ) THEN
        ALTER TABLE public.fee_structures 
        ADD CONSTRAINT fee_structures_amount_check 
        CHECK (amount >= 0);
    END IF;

    -- Add check constraint for frequency if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_frequency_check'
    ) THEN
        ALTER TABLE public.fee_structures 
        ADD CONSTRAINT fee_structures_frequency_check 
        CHECK (frequency IN ('Monthly', 'Quarterly', 'Annually', 'One Time'));
    END IF;

    -- Add unique constraint if it doesn't exist (now that academic_year_id column exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fee_structures_class_id_academic_year_id_fee_type_key'
    ) THEN
        ALTER TABLE public.fee_structures 
        ADD CONSTRAINT fee_structures_class_id_academic_year_id_fee_type_key 
        UNIQUE(class_id, academic_year_id, fee_type);
    END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
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

-- Add date_of_join to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS date_of_join DATE;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_fee_structures_updated_at ON public.fee_structures;
CREATE TRIGGER update_fee_structures_updated_at
    BEFORE UPDATE ON public.fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_year ON public.fee_structures(class_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_fee ON public.payments(student_id, fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_students_date_of_join ON public.students(date_of_join);
