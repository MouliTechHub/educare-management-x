-- Fix ambiguous embed between students and student_fee_records

-- A) Ensure a single, named FK used for embeds
alter table public.student_fee_records
  drop constraint if exists student_fee_records_student_id_fkey,
  add constraint student_fee_records_student_id_fkey
    foreign key (student_id)
    references public.students(id)
    on delete cascade;

-- Add helpful indexes
create index if not exists idx_sfr_student_year on public.student_fee_records(student_id, academic_year_id);

-- C) Create a safer alternative view for students with fees
create or replace view public.v_students_with_fees as
select 
  s.id as student_id, 
  s.first_name,
  s.last_name,
  s.admission_number,
  s.status,
  s.class_id,
  fr.id as fee_record_id,
  fr.academic_year_id, 
  fr.fee_type, 
  fr.actual_fee, 
  fr.paid_amount, 
  fr.discount_amount, 
  fr.balance_fee,
  fr.status as fee_status,
  fr.due_date
from public.students s
left join public.student_fee_records fr on fr.student_id = s.id;