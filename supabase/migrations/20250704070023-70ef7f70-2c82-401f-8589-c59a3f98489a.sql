-- Add 'Previous Year Dues' to the fees_fee_type_check constraint
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
  'Other Fee'::text,
  'Previous Year Dues'::text
]));