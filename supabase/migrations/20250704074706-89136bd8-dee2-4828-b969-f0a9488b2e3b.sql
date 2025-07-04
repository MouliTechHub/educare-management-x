-- First, remove any existing 'Previous Year Dues' fee records since we now handle this separately
DELETE FROM public.fees WHERE fee_type = 'Previous Year Dues';

-- Now remove 'Previous Year Dues' from the fees_fee_type_check constraint
ALTER TABLE public.fees DROP CONSTRAINT fees_fee_type_check;

ALTER TABLE public.fees ADD CONSTRAINT fees_fee_type_check 
CHECK (fee_type = ANY (ARRAY[
  'Tuition Fee'::text, 
  'Development Fee'::text, 
  'Library Fee'::text, 
  'Laboratory Fee'::text, 
  'Sports Fee'::text, 
  'Transport Fee'::text, 
  'Exam Fee'::text, 
  'Books Fee'::text, 
  'Uniform Fee'::text, 
  'Activities Fee'::text, 
  'Meals Fee'::text, 
  'Other Fee'::text
]));