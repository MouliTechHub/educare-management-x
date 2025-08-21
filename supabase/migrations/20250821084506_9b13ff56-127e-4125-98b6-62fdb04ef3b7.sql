-- Fix Fee Management to show all students by making listing tolerant to missing enrollments

-- A) Replace the join view with LEFT JOIN (tolerant listing)
create or replace view public.v_fee_records_with_enrollment as
select
  fr.*,
  coalesce(se.class_id, fr.class_id) as enrolled_class_id,  -- fall back to fee row's class
  se.academic_year_id as enrolled_year_id,
  c.name as enrolled_class_name,
  c.section as enrolled_class_section
from public.student_fee_records fr
left join public.student_enrollments se
  on se.student_id = fr.student_id
 and se.academic_year_id = fr.academic_year_id
left join public.classes c
  on c.id = coalesce(se.class_id, fr.class_id);

-- B) Add unique constraint for enrollments (if not exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'uq_se_student_year' 
    and table_name = 'student_enrollments'
  ) then
    alter table public.student_enrollments
      add constraint uq_se_student_year unique (student_id, academic_year_id);
  end if;
end $$;

-- C) Backfill missing enrollments from existing fee records
insert into public.student_enrollments (student_id, academic_year_id, class_id)
select distinct fr.student_id, fr.academic_year_id, fr.class_id
from public.student_fee_records fr
left join public.student_enrollments se
  on se.student_id = fr.student_id and se.academic_year_id = fr.academic_year_id
where se.student_id is null
on conflict (student_id, academic_year_id) do nothing;

-- D) Add foreign keys and indexes for performance (if not exists)
do $$
begin
  -- Add foreign keys if they don't exist
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_sfr_student' and table_name = 'student_fee_records'
  ) then
    alter table public.student_fee_records
      add constraint fk_sfr_student foreign key (student_id) references public.students(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_sfr_year' and table_name = 'student_fee_records'
  ) then
    alter table public.student_fee_records
      add constraint fk_sfr_year foreign key (academic_year_id) references public.academic_years(id) on delete cascade;
  end if;

  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_sfr_class' and table_name = 'student_fee_records'
  ) then
    alter table public.student_fee_records
      add constraint fk_sfr_class foreign key (class_id) references public.classes(id) on delete cascade;
  end if;
end $$;

-- E) Add performance indexes
create index if not exists idx_sfr_year_student on public.student_fee_records(academic_year_id, student_id);
create index if not exists idx_se_year_student on public.student_enrollments(academic_year_id, student_id);
create index if not exists idx_sfr_student_year_type on public.student_fee_records(student_id, academic_year_id, fee_type);

-- F) Grant proper permissions on the view
grant select on public.v_fee_records_with_enrollment to authenticated, anon;