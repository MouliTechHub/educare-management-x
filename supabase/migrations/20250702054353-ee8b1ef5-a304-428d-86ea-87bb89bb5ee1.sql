
-- First, let's see what constraints currently exist
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'fee_structures'::regclass 
AND contype = 'c';

-- Drop ALL existing check constraints on fee_structures table
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'fee_structures'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
    END LOOP;
END $$;

-- Now add the correct constraint with proper fee types
ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_fee_type_check CHECK (
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

-- Also add constraints for other fields to ensure data integrity
ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_frequency_check CHECK (
  frequency IN ('Monthly', 'Quarterly', 'Annually', 'One Time')
);

ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_amount_positive CHECK (
  amount > 0
);

-- Update any existing data to use the new standardized fee types
UPDATE fee_structures SET fee_type = 'Tuition Fee' WHERE fee_type IN ('Tuition', 'tuition', 'TUITION');
UPDATE fee_structures SET fee_type = 'Development Fee' WHERE fee_type IN ('Development', 'development', 'DEVELOPMENT');
UPDATE fee_structures SET fee_type = 'Library Fee' WHERE fee_type IN ('Library', 'library', 'LIBRARY');
UPDATE fee_structures SET fee_type = 'Laboratory Fee' WHERE fee_type IN ('Lab', 'Laboratory', 'lab', 'laboratory', 'LAB');
UPDATE fee_structures SET fee_type = 'Sports Fee' WHERE fee_type IN ('Sports', 'sports', 'SPORTS');
UPDATE fee_structures SET fee_type = 'Transport Fee' WHERE fee_type IN ('Transport', 'transport', 'TRANSPORT');
UPDATE fee_structures SET fee_type = 'Exam Fee' WHERE fee_type IN ('Exam', 'exam', 'EXAM');
UPDATE fee_structures SET fee_type = 'Books Fee' WHERE fee_type IN ('Books', 'Book', 'books', 'book', 'BOOKS');
UPDATE fee_structures SET fee_type = 'Uniform Fee' WHERE fee_type IN ('Uniform', 'uniform', 'UNIFORM');
UPDATE fee_structures SET fee_type = 'Activities Fee' WHERE fee_type IN ('Activities', 'Activity', 'activities', 'activity', 'ACTIVITIES');
UPDATE fee_structures SET fee_type = 'Meals Fee' WHERE fee_type IN ('Meals', 'Meal', 'meals', 'meal', 'MEALS');
UPDATE fee_structures SET fee_type = 'Other Fee' WHERE fee_type IN ('Other', 'other', 'OTHER', 'Misc', 'misc', 'MISC');

-- Verify the constraint is in place
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'fee_structures'::regclass 
AND contype = 'c';
