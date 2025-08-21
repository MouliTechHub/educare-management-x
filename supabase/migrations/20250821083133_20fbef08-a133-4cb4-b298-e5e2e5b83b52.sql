-- Fix PYD (Previous Year Dues) functionality with proper views and RPC
-- Views used by the RPC (idempotent)
create or replace view public.v_fee_outstanding as
select id, academic_year_id, student_id, class_id, fee_type,
       greatest(coalesce(actual_fee,0)-coalesce(paid_amount,0)-coalesce(discount_amount,0),0)::numeric(12,2) as outstanding
from public.student_fee_records;

create or replace view public.v_pyd as
select academic_year_id, student_id, class_id, outstanding
from public.v_fee_outstanding
where fee_type = 'Previous Year Dues' and outstanding > 0;

-- Enhanced RPC that the UI calls (matches existing get_pyd_summary_enhanced)
create or replace function public.get_pyd_summary(p_year uuid)
returns table(
  students_with_dues int,
  total_outstanding  numeric,
  avg_per_student    numeric,
  high_count         int,
  medium_count       int,  
  low_count          int
)
language sql
stable
security definer
set search_path = public
as $$
  with pyd_per_student as (
    select student_id, sum(outstanding) as pyd_outstanding
    from public.v_pyd
    where academic_year_id = p_year
    group by student_id
    having sum(outstanding) > 0
  ),
  totals as (
    select
      count(*)::int as students_with_dues,
      coalesce(sum(pyd_outstanding), 0)::numeric(12,2) as total_outstanding,
      case when count(*) > 0 
        then (coalesce(sum(pyd_outstanding), 0) / count(*))::numeric(12,2)
        else 0::numeric(12,2)
      end as avg_per_student
    from pyd_per_student
  ),
  buckets as (
    select
      sum(case when pyd_outstanding >= 25000 then 1 else 0 end)::int as high_count,
      sum(case when pyd_outstanding >= 10000 and pyd_outstanding < 25000 then 1 else 0 end)::int as medium_count,
      sum(case when pyd_outstanding > 0 and pyd_outstanding < 10000 then 1 else 0 end)::int as low_count
    from pyd_per_student
  )
  select 
    t.students_with_dues, 
    t.total_outstanding, 
    t.avg_per_student, 
    b.high_count, 
    b.medium_count, 
    b.low_count
  from totals t cross join buckets b;
$$;

-- Grant permissions
grant execute on function public.get_pyd_summary(uuid) to authenticated, anon;

-- RLS policies for the views (if needed)
create policy if not exists "Allow authenticated users to view fee outstanding"
on public.v_fee_outstanding
for select
to authenticated
using (true);

create policy if not exists "Allow authenticated users to view PYD"
on public.v_pyd
for select
to authenticated
using (true);

-- Enable RLS on views
alter table public.v_fee_outstanding enable row level security;
alter table public.v_pyd enable row level security;