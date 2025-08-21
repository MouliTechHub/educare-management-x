-- Add foreign key constraints for PostgREST relationship detection
alter table public.student_fee_records
  add constraint if not exists fk_sfr_student
    foreign key (student_id) references public.students(id) on delete cascade,
  add constraint if not exists fk_sfr_year
    foreign key (academic_year_id) references public.academic_years(id) on delete cascade,
  add constraint if not exists fk_sfr_class
    foreign key (class_id) references public.classes(id) on delete cascade;

alter table public.student_enrollments
  add constraint if not exists fk_se_student
    foreign key (student_id) references public.students(id) on delete cascade,
  add constraint if not exists fk_se_year
    foreign key (academic_year_id) references public.academic_years(id) on delete cascade,
  add constraint if not exists fk_se_class
    foreign key (class_id) references public.classes(id) on delete cascade,
  add constraint if not exists uq_se_student_year
    unique (student_id, academic_year_id);

-- Create view that joins fee records with enrollments by academic year
create or replace view public.v_fee_records_with_enrollment as
select
  fr.*,
  se.class_id as enrolled_class_id,
  se.academic_year_id as enrolled_year_id,
  c.name as enrolled_class_name,
  c.section as enrolled_class_section
from public.student_fee_records fr
join public.student_enrollments se
  on se.student_id = fr.student_id
 and se.academic_year_id = fr.academic_year_id
join public.classes c
  on c.id = se.class_id;