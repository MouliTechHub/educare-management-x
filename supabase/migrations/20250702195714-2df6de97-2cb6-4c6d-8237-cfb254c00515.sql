-- Add academic_year_id foreign key to teacher_salaries table
ALTER TABLE public.teacher_salaries 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id);

-- Update existing records to use current academic year
UPDATE public.teacher_salaries 
SET academic_year_id = (
  SELECT id FROM public.academic_years WHERE is_current = true LIMIT 1
)
WHERE academic_year_id IS NULL;

-- Make academic_year_id NOT NULL after updating existing records
ALTER TABLE public.teacher_salaries 
ALTER COLUMN academic_year_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_salaries_academic_year ON public.teacher_salaries(academic_year_id);