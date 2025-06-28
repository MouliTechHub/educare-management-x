
-- First, let's see what the current check constraint is
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'fees'::regclass AND contype = 'c';

-- If the constraint requires amount > 0, we need to modify it to allow 0
-- Let's drop the existing constraint and recreate it to allow amount >= 0
ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_amount_check;

-- Add a new constraint that allows amount to be 0 or positive
ALTER TABLE fees ADD CONSTRAINT fees_amount_check CHECK (amount >= 0);
