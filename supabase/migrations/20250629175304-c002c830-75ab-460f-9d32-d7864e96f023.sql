
-- Add missing columns to parents table
ALTER TABLE public.parents 
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT,
ADD COLUMN IF NOT EXISTS education_qualification TEXT;

-- Add missing columns to teachers table  
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT,
ADD COLUMN IF NOT EXISTS pan_number TEXT;

-- Add missing columns to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS mother_tongue TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian',
ADD COLUMN IF NOT EXISTS transfer_certificate TEXT;
