
-- Update phone number validation constraints to use the exact pattern requested
-- Pattern: +91 followed by exactly 10 digits using [0-9] instead of \d

-- Update parents table phone number constraints
ALTER TABLE parents DROP CONSTRAINT IF EXISTS parents_phone_number_check;
ALTER TABLE parents ADD CONSTRAINT parents_phone_number_check 
CHECK (phone_number ~ '^\+91[0-9]{10}$');

ALTER TABLE parents DROP CONSTRAINT IF EXISTS parents_alternate_phone_check;
ALTER TABLE parents ADD CONSTRAINT parents_alternate_phone_check 
CHECK (alternate_phone IS NULL OR alternate_phone ~ '^\+91[0-9]{10}$');

-- Update teachers table phone number constraints
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_phone_number_check;
ALTER TABLE teachers ADD CONSTRAINT teachers_phone_number_check 
CHECK (phone_number ~ '^\+91[0-9]{10}$');

ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_emergency_contact_phone_check;
ALTER TABLE teachers ADD CONSTRAINT teachers_emergency_contact_phone_check 
CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~ '^\+91[0-9]{10}$');

-- Update students table emergency contact phone constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_emergency_contact_phone_check;
ALTER TABLE students ADD CONSTRAINT students_emergency_contact_phone_check 
CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~ '^\+91[0-9]{10}$');
