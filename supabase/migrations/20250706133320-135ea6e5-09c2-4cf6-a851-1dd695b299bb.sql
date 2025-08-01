-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS trigger_auto_assign_tuition_fee ON public.students;
DROP TRIGGER IF EXISTS trigger_update_fee_record_on_payment ON public.fee_payment_records;
DROP TRIGGER IF EXISTS trigger_calculate_fee_amounts ON public.student_fee_records;

-- Fix the auto_assign_tuition_fee function to match actual fee_type values
CREATE OR REPLACE FUNCTION public.auto_assign_tuition_fee()
RETURNS TRIGGER AS $$
DECLARE
  current_year_id UUID;
  fee_structure_record RECORD;
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
  
  -- Calculate due date (30 days from now)
  due_date_calculated := CURRENT_DATE + INTERVAL '30 days';
  
  -- Get all fee structures for the student's class and current academic year
  FOR fee_structure_record IN 
    SELECT *
    FROM public.fee_structures
    WHERE class_id = NEW.class_id 
      AND academic_year_id = current_year_id
      AND is_active = true
  LOOP
    -- Insert fee record for each fee structure
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
      fee_structure_record.fee_type,
      fee_structure_record.amount,
      due_date_calculated,
      'Pending'
    )
    ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate all triggers
CREATE TRIGGER trigger_auto_assign_tuition_fee
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_tuition_fee();

CREATE TRIGGER trigger_update_fee_record_on_payment
  AFTER INSERT OR UPDATE ON public.fee_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fee_record_on_payment();

CREATE TRIGGER trigger_calculate_fee_amounts
  BEFORE INSERT OR UPDATE ON public.student_fee_records
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_fee_amounts();

-- Create missing fee records for existing students
WITH current_year AS (
  SELECT id FROM public.academic_years WHERE is_current = true LIMIT 1
)
INSERT INTO public.student_fee_records (
  student_id,
  class_id,
  academic_year_id,
  fee_type,
  actual_fee,
  discount_amount,
  paid_amount,
  due_date,
  status
)
SELECT 
  s.id as student_id,
  s.class_id,
  cy.id as academic_year_id,
  fs.fee_type,
  fs.amount as actual_fee,
  0 as discount_amount,
  0 as paid_amount,
  CURRENT_DATE + INTERVAL '30 days' as due_date,
  'Pending' as status
FROM public.students s
CROSS JOIN current_year cy
JOIN public.fee_structures fs ON s.class_id = fs.class_id
WHERE s.status = 'Active' 
  AND fs.academic_year_id = cy.id
  AND fs.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.student_fee_records sfr 
    WHERE sfr.student_id = s.id 
      AND sfr.academic_year_id = cy.id 
      AND sfr.fee_type = fs.fee_type
  );