
-- First drop the existing constraint
ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_fee_type_check;

-- Add the new constraint with all the fee types used in the frontend
ALTER TABLE fees ADD CONSTRAINT fees_fee_type_check CHECK (
  fee_type IN (
    'Tuition',
    'Development', 
    'Library',
    'Lab',
    'Sports',
    'Transport',
    'Exam',
    'Other'
  )
);
