
-- First, let's see exactly what constraints exist
SELECT 
    schemaname,
    tablename,
    constraintname,
    constraintdef
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
JOIN pg_stat_user_tables s ON s.schemaname = n.nspname AND s.tablename = t.relname
WHERE t.relname = 'fee_structures'
AND c.contype = 'c';

-- Drop ALL constraints on fee_structures table (including any hidden ones)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'fee_structures' 
        AND constraint_type = 'CHECK'
        AND table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Also try dropping by the specific constraint name we've seen
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_fee_type_check;
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_frequency_check;
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_amount_positive;

-- Wait a moment and add the new constraint
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_fee_type_check CHECK (
  fee_type IN (
    'Tuition Fee',
    'Development Fee', 
    'Library Fee',
    'Laboratory Fee', 
    'Sports Fee',
    'Transport Fee',
    'Exam Fee',
    'Books Fee',
    'Uniform Fee',
    'Activities Fee',
    'Meals Fee',
    'Other Fee'
  )
);

-- Add other constraints
ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_frequency_check CHECK (
  frequency IN ('Monthly', 'Quarterly', 'Annually', 'One Time')
);

ALTER TABLE public.fee_structures ADD CONSTRAINT fee_structures_amount_positive CHECK (
  amount > 0
);

-- Test the constraint by selecting valid fee types
SELECT 'Tuition Fee' AS test_fee_type WHERE 'Tuition Fee' IN (
  'Tuition Fee',
  'Development Fee', 
  'Library Fee',
  'Laboratory Fee', 
  'Sports Fee',
  'Transport Fee',
  'Exam Fee',
  'Books Fee',
  'Uniform Fee',
  'Activities Fee',
  'Meals Fee',
  'Other Fee'
);

-- Show final constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.fee_structures'::regclass 
AND contype = 'c';
