-- Create a table for tracking discount history
CREATE TABLE IF NOT EXISTS public.discount_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_id UUID REFERENCES public.fees(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('Fixed Amount', 'Percentage')),
  discount_percentage NUMERIC,
  reason TEXT NOT NULL,
  notes TEXT,
  applied_by TEXT NOT NULL DEFAULT 'Admin',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the discount_history table
ALTER TABLE public.discount_history ENABLE ROW LEVEL SECURITY;

-- Create policy for discount history
CREATE POLICY "Allow all for authenticated users" ON public.discount_history
FOR ALL USING (true);

-- Create trigger to automatically log discount changes
CREATE OR REPLACE FUNCTION log_discount_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if discount_amount actually changed
    IF TG_OP = 'UPDATE' AND (OLD.discount_amount IS DISTINCT FROM NEW.discount_amount) THEN
        INSERT INTO public.discount_history (
            fee_id,
            student_id,
            discount_amount,
            discount_type,
            reason,
            notes,
            applied_by
        ) VALUES (
            NEW.id,
            NEW.student_id,
            NEW.discount_amount - COALESCE(OLD.discount_amount, 0),
            'Fixed Amount',
            COALESCE(NEW.discount_notes, 'Discount updated'),
            NEW.discount_notes,
            COALESCE(NEW.discount_updated_by, 'Admin')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both fee tables
CREATE TRIGGER fees_discount_history_trigger
    AFTER UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

CREATE TRIGGER student_fee_records_discount_history_trigger
    AFTER UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION log_discount_changes();

-- Create payment blockage log table for tracking when payments are blocked
CREATE TABLE IF NOT EXISTS public.payment_blockage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  blocked_amount NUMERIC NOT NULL,
  outstanding_dues NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  academic_year_id UUID REFERENCES public.academic_years(id)
);

-- Enable RLS
ALTER TABLE public.payment_blockage_log ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for authenticated users" ON public.payment_blockage_log
FOR ALL USING (true);