-- Fix TypeScript issues and prepare database for comprehensive enhancements

-- Add missing notes field to fees table for admin comments
ALTER TABLE public.fees ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing aadhaar_number field to teachers table if it doesn't exist  
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
ALTER TABLE public.teachers ADD CONSTRAINT IF NOT EXISTS aadhaar_number_check CHECK (aadhaar_number IS NULL OR aadhaar_number ~ '^[0-9]{12}$');
ALTER TABLE public.teachers ADD CONSTRAINT IF NOT EXISTS aadhaar_number_unique UNIQUE(aadhaar_number);

-- Create expenses table for expense management
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  paid_to TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  receipt_url TEXT,
  academic_year_id UUID REFERENCES public.academic_years(id) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT DEFAULT 'Admin'
);

-- Create teacher_salaries table for salary management
CREATE TABLE IF NOT EXISTS public.teacher_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  working_days INTEGER NOT NULL DEFAULT 26,
  attended_days INTEGER NOT NULL DEFAULT 26,
  salary_rate NUMERIC NOT NULL CHECK (salary_rate > 0),
  calculated_salary NUMERIC NOT NULL CHECK (calculated_salary >= 0),
  final_salary NUMERIC NOT NULL CHECK (final_salary >= 0),
  deductions NUMERIC DEFAULT 0 CHECK (deductions >= 0),
  bonus NUMERIC DEFAULT 0 CHECK (bonus >= 0),
  payment_date DATE,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, month, year)
);

-- Enable RLS on new tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
CREATE POLICY "Allow all for authenticated users" ON public.expenses
  FOR ALL TO authenticated USING (true);

-- Create RLS policies for teacher_salaries
CREATE POLICY "Allow all for authenticated users" ON public.teacher_salaries
  FOR ALL TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_academic_year ON public.expenses(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_teacher ON public.teacher_salaries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_month_year ON public.teacher_salaries(month, year);

-- Add trigger to update updated_at columns
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_salaries_updated_at
  BEFORE UPDATE ON public.teacher_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();