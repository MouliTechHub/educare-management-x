-- Phase 1: Foundation - Database Structure Updates

-- Add carry forward tracking table
CREATE TABLE IF NOT EXISTS public.fee_carry_forward (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  from_academic_year_id UUID NOT NULL,
  to_academic_year_id UUID NOT NULL,
  original_amount NUMERIC NOT NULL DEFAULT 0,
  carried_amount NUMERIC NOT NULL DEFAULT 0,
  carry_forward_type TEXT NOT NULL DEFAULT 'automatic', -- 'automatic', 'manual', 'waived'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paid', 'waived'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'System',
  notes TEXT,
  
  -- Constraints
  CONSTRAINT fk_carry_forward_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  CONSTRAINT fk_carry_forward_from_year FOREIGN KEY (from_academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE,
  CONSTRAINT fk_carry_forward_to_year FOREIGN KEY (to_academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate carry forwards
  CONSTRAINT unique_student_year_carry_forward UNIQUE (student_id, from_academic_year_id, to_academic_year_id)
);

-- Add audit log table for all fee-related actions
CREATE TABLE IF NOT EXISTS public.fee_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  fee_record_id UUID,
  action_type TEXT NOT NULL, -- 'payment', 'discount', 'waiver', 'carry_forward', 'block', 'unblock'
  old_values JSONB,
  new_values JSONB,
  amount_affected NUMERIC DEFAULT 0,
  academic_year_id UUID NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  notes TEXT,
  reference_number TEXT, -- receipt number, transaction id, etc.
  
  -- Constraints
  CONSTRAINT fk_audit_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_fee_record FOREIGN KEY (fee_record_id) REFERENCES public.student_fee_records(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_academic_year FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE
);

-- Add fee allocation priority table
CREATE TABLE IF NOT EXISTS public.fee_allocation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  allocation_order INTEGER NOT NULL, -- 1 = highest priority (oldest dues first)
  fee_type TEXT NOT NULL,
  academic_year_priority TEXT NOT NULL DEFAULT 'oldest_first', -- 'oldest_first', 'newest_first', 'current_year_first'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint
  CONSTRAINT unique_allocation_order UNIQUE (allocation_order)
);

-- Insert default allocation rules (FIFO - First In, First Out)
INSERT INTO public.fee_allocation_rules (rule_name, allocation_order, fee_type, academic_year_priority) VALUES
  ('Previous Year Dues Priority', 1, 'Previous Year Dues', 'oldest_first'),
  ('Regular Fees FIFO', 2, 'ALL', 'oldest_first')
ON CONFLICT (allocation_order) DO NOTHING;

-- Add payment allocation tracking
CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_record_id UUID NOT NULL,
  fee_record_id UUID NOT NULL,
  allocated_amount NUMERIC NOT NULL,
  allocation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  allocation_order INTEGER NOT NULL, -- order in which payment was allocated
  
  -- Constraints
  CONSTRAINT fk_allocation_payment FOREIGN KEY (payment_record_id) REFERENCES public.fee_payment_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_allocation_fee FOREIGN KEY (fee_record_id) REFERENCES public.student_fee_records(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate allocations
  CONSTRAINT unique_payment_fee_allocation UNIQUE (payment_record_id, fee_record_id)
);

-- Update student_fee_records table with additional tracking columns
ALTER TABLE public.student_fee_records 
ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_by TEXT,
ADD COLUMN IF NOT EXISTS carry_forward_source_id UUID,
ADD COLUMN IF NOT EXISTS is_carry_forward BOOLEAN DEFAULT false;

-- Add foreign key for carry forward source
ALTER TABLE public.student_fee_records 
ADD CONSTRAINT fk_carry_forward_source 
FOREIGN KEY (carry_forward_source_id) REFERENCES public.fee_carry_forward(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_carry_forward_student ON public.fee_carry_forward(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_carry_forward_years ON public.fee_carry_forward(from_academic_year_id, to_academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_audit_log_student ON public.fee_audit_log(student_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_fee_audit_log_action ON public.fee_audit_log(action_type, performed_at);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON public.payment_allocations(payment_record_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_records_priority ON public.student_fee_records(student_id, academic_year_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_student_fee_records_blocked ON public.student_fee_records(payment_blocked, student_id);

-- Enable RLS on new tables
ALTER TABLE public.fee_carry_forward ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all for authenticated users fee_carry_forward" 
ON public.fee_carry_forward FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users fee_audit_log" 
ON public.fee_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users fee_allocation_rules" 
ON public.fee_allocation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users payment_allocations" 
ON public.payment_allocations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add realtime capabilities
ALTER TABLE public.fee_carry_forward REPLICA IDENTITY FULL;
ALTER TABLE public.fee_audit_log REPLICA IDENTITY FULL;
ALTER TABLE public.payment_allocations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_carry_forward;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_audit_log;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_allocations;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;