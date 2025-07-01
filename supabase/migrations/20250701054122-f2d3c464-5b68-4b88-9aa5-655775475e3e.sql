
-- Create enhanced fee management structure
CREATE TABLE IF NOT EXISTS public.student_fee_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL DEFAULT 'Tuition Fee',
  actual_fee NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  final_fee NUMERIC GENERATED ALWAYS AS (actual_fee - discount_amount) STORED,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  balance_fee NUMERIC GENERATED ALWAYS AS (actual_fee - discount_amount - paid_amount) STORED,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue', 'Partial')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discount_updated_by TEXT,
  discount_updated_at TIMESTAMP WITH TIME ZONE,
  discount_notes TEXT,
  UNIQUE(student_id, class_id, academic_year_id, fee_type)
);

-- Create enhanced payment tracking
CREATE TABLE IF NOT EXISTS public.fee_payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_record_id UUID NOT NULL REFERENCES public.student_fee_records(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL CHECK (amount_paid > 0),
  payment_date DATE NOT NULL,
  payment_time TIME NOT NULL DEFAULT CURRENT_TIME,
  payment_method TEXT NOT NULL DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Card', 'PhonePe', 'GPay', 'Online', 'Cheque', 'Bank Transfer')),
  late_fee NUMERIC DEFAULT 0,
  receipt_number TEXT NOT NULL,
  payment_receiver TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'System'
);

-- Create change history tracking
CREATE TABLE IF NOT EXISTS public.fee_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_record_id UUID NOT NULL REFERENCES public.student_fee_records(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('payment', 'discount', 'creation', 'status_update')),
  previous_value NUMERIC,
  new_value NUMERIC,
  amount NUMERIC,
  changed_by TEXT NOT NULL,
  change_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  payment_method TEXT,
  receipt_number TEXT
);

-- Function to automatically assign tuition fees to new students
CREATE OR REPLACE FUNCTION public.auto_assign_tuition_fee()
RETURNS TRIGGER AS $$
DECLARE
  current_year_id UUID;
  tuition_fee_amount NUMERIC;
  due_date_calculated DATE;
BEGIN
  -- Get current academic year
  SELECT id INTO current_year_id 
  FROM public.academic_years 
  WHERE is_current = true 
  LIMIT 1;
  
  IF current_year_id IS NULL THEN
    RAISE NOTICE 'No current academic year found';
    RETURN NEW;
  END IF;
  
  -- Get tuition fee for the student's class
  SELECT amount INTO tuition_fee_amount
  FROM public.fee_structures
  WHERE class_id = NEW.class_id 
    AND academic_year_id = current_year_id
    AND fee_type = 'Tuition'
    AND is_active = true
  LIMIT 1;
  
  IF tuition_fee_amount IS NULL THEN
    RAISE NOTICE 'No tuition fee structure found for class % in academic year %', NEW.class_id, current_year_id;
    RETURN NEW;
  END IF;
  
  -- Calculate due date (30 days from now)
  due_date_calculated := CURRENT_DATE + INTERVAL '30 days';
  
  -- Insert fee record if it doesn't exist
  INSERT INTO public.student_fee_records (
    student_id,
    class_id,
    academic_year_id,
    fee_type,
    actual_fee,
    due_date,
    status
  )
  VALUES (
    NEW.id,
    NEW.class_id,
    current_year_id,
    'Tuition Fee',
    tuition_fee_amount,
    due_date_calculated,
    'Pending'
  )
  ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
  
  -- Log the creation
  INSERT INTO public.fee_change_history (
    fee_record_id,
    change_type,
    new_value,
    amount,
    changed_by,
    notes
  )
  SELECT 
    sfr.id,
    'creation',
    tuition_fee_amount,
    tuition_fee_amount,
    'System',
    'Auto-assigned tuition fee for new student'
  FROM public.student_fee_records sfr
  WHERE sfr.student_id = NEW.id 
    AND sfr.class_id = NEW.class_id 
    AND sfr.academic_year_id = current_year_id
    AND sfr.fee_type = 'Tuition Fee';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update fee records when payments are made
CREATE OR REPLACE FUNCTION public.update_fee_record_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update paid amount in fee record
  UPDATE public.student_fee_records
  SET 
    paid_amount = COALESCE((
      SELECT SUM(amount_paid) 
      FROM public.fee_payment_records 
      WHERE fee_record_id = NEW.fee_record_id
    ), 0),
    status = CASE 
      WHEN (actual_fee - discount_amount) <= COALESCE((
        SELECT SUM(amount_paid) 
        FROM public.fee_payment_records 
        WHERE fee_record_id = NEW.fee_record_id
      ), 0) THEN 'Paid'
      WHEN COALESCE((
        SELECT SUM(amount_paid) 
        FROM public.fee_payment_records 
        WHERE fee_record_id = NEW.fee_record_id
      ), 0) > 0 THEN 'Partial'
      WHEN due_date < CURRENT_DATE THEN 'Overdue'
      ELSE 'Pending'
    END,
    updated_at = now()
  WHERE id = NEW.fee_record_id;
  
  -- Log the payment in change history
  INSERT INTO public.fee_change_history (
    fee_record_id,
    change_type,
    amount,
    changed_by,
    notes,
    payment_method,
    receipt_number
  )
  VALUES (
    NEW.fee_record_id,
    'payment',
    NEW.amount_paid,
    NEW.created_by,
    COALESCE(NEW.notes, 'Payment recorded'),
    NEW.payment_method,
    NEW.receipt_number
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_auto_assign_tuition_fee ON public.students;
CREATE TRIGGER trigger_auto_assign_tuition_fee
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_tuition_fee();

DROP TRIGGER IF EXISTS trigger_update_fee_record_on_payment ON public.fee_payment_records;
CREATE TRIGGER trigger_update_fee_record_on_payment
    AFTER INSERT ON public.fee_payment_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_fee_record_on_payment();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_fee_records_student_year ON public.student_fee_records(student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_records_class_year ON public.student_fee_records(class_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_payment_records_fee_record ON public.fee_payment_records(fee_record_id);
CREATE INDEX IF NOT EXISTS idx_fee_change_history_fee_record ON public.fee_change_history(fee_record_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_student_fee_records_updated_at
    BEFORE UPDATE ON public.student_fee_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
