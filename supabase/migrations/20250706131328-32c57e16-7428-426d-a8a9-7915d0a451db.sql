-- Create missing fee records for existing students
WITH current_year AS (
  SELECT id FROM public.academic_years WHERE is_current = true LIMIT 1
),
student_fee_data AS (
  SELECT 
    s.id as student_id,
    s.class_id,
    fs.fee_type,
    fs.amount as actual_fee,
    cy.id as academic_year_id
  FROM public.students s
  JOIN public.fee_structures fs ON s.class_id = fs.class_id
  CROSS JOIN current_year cy
  JOIN public.academic_years ay ON fs.academic_year_id = ay.id
  WHERE s.status = 'Active' 
    AND fs.is_active = true
    AND ay.is_current = true
    AND NOT EXISTS (
      SELECT 1 FROM public.student_fee_records sfr 
      WHERE sfr.student_id = s.id 
        AND sfr.academic_year_id = cy.id 
        AND sfr.fee_type = fs.fee_type
    )
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
  student_id,
  class_id,
  academic_year_id,
  fee_type,
  actual_fee,
  0 as discount_amount,
  0 as paid_amount,
  CURRENT_DATE + INTERVAL '30 days' as due_date,
  'Pending' as status
FROM student_fee_data;