-- Fix remaining security issues from linter

-- Fix search_path for remaining functions
CREATE OR REPLACE FUNCTION public.calculate_fee_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate final_fee and balance_fee
  NEW.final_fee = NEW.actual_fee - NEW.discount_amount;
  NEW.balance_fee = NEW.final_fee - NEW.paid_amount;
  
  -- Update status based on payment
  IF NEW.balance_fee <= 0 THEN
    NEW.status = 'Paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status = 'Partial';
  ELSIF NEW.due_date < CURRENT_DATE THEN
    NEW.status = 'Overdue';
  ELSE
    NEW.status = 'Pending';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_fee_structure_exists(target_academic_year_id uuid, target_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.fee_structures 
    WHERE academic_year_id = target_academic_year_id 
    AND class_id = target_class_id 
    AND is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_fee_total_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the total_paid for the affected fee, but only include payments from the same academic year
  UPDATE public.fees 
  SET total_paid = COALESCE((
    SELECT SUM(ph.amount_paid) 
    FROM public.payment_history ph 
    JOIN public.fees f ON ph.fee_id = f.id
    WHERE ph.fee_id = COALESCE(NEW.fee_id, OLD.fee_id)
    AND f.academic_year_id = (SELECT academic_year_id FROM public.fees WHERE id = COALESCE(NEW.fee_id, OLD.fee_id))
  ), 0)
  WHERE id = COALESCE(NEW.fee_id, OLD.fee_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_student_fee_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_fee_record_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Enable RLS on missing tables
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_change_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for academic_years
CREATE POLICY "Academic years viewable by all authenticated users" 
ON public.academic_years 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify academic years" 
ON public.academic_years 
FOR ALL 
USING (public.is_admin());

-- Add RLS policies for fee_structures
CREATE POLICY "Fee structures viewable by finance managers" 
ON public.fee_structures 
FOR SELECT 
USING (public.can_manage_finances());

CREATE POLICY "Only admins can modify fee structures" 
ON public.fee_structures 
FOR ALL 
USING (public.is_admin());

-- Add RLS policies for student_academic_records
CREATE POLICY "Academic records viewable by staff" 
ON public.student_academic_records 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.has_role('teacher'::app_role) OR 
  public.has_role('accountant'::app_role)
);

CREATE POLICY "Only admins can modify academic records" 
ON public.student_academic_records 
FOR ALL 
USING (public.is_admin());

-- Add RLS policies for fee_change_history
CREATE POLICY "Fee change history viewable by finance managers" 
ON public.fee_change_history 
FOR SELECT 
USING (public.can_manage_finances());

CREATE POLICY "Only system can insert fee change history" 
ON public.fee_change_history 
FOR INSERT 
WITH CHECK (true);