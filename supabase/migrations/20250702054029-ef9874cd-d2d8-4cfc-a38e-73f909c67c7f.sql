
-- First, let's check the current constraint on fee_structures
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'fee_structures'::regclass 
AND contype = 'c';

-- Drop the existing constraint and recreate it with the correct fee types
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_fee_type_check;

-- Add the updated constraint with standardized fee types
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

-- Also update any existing data that might have old fee type values
UPDATE fee_structures SET fee_type = 'Tuition Fee' WHERE fee_type = 'Tuition';
UPDATE fee_structures SET fee_type = 'Development Fee' WHERE fee_type = 'Development';
UPDATE fee_structures SET fee_type = 'Library Fee' WHERE fee_type = 'Library';
UPDATE fee_structures SET fee_type = 'Laboratory Fee' WHERE fee_type IN ('Lab', 'Laboratory');
UPDATE fee_structures SET fee_type = 'Sports Fee' WHERE fee_type = 'Sports';
UPDATE fee_structures SET fee_type = 'Transport Fee' WHERE fee_type = 'Transport';
UPDATE fee_structures SET fee_type = 'Exam Fee' WHERE fee_type = 'Exam';
UPDATE fee_structures SET fee_type = 'Books Fee' WHERE fee_type = 'Books';
UPDATE fee_structures SET fee_type = 'Uniform Fee' WHERE fee_type = 'Uniform';
UPDATE fee_structures SET fee_type = 'Activities Fee' WHERE fee_type = 'Activities';
UPDATE fee_structures SET fee_type = 'Meals Fee' WHERE fee_type = 'Meals';
UPDATE fee_structures SET fee_type = 'Other Fee' WHERE fee_type = 'Other';
