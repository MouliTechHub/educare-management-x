
-- Add missing fields to students table
ALTER TABLE students ADD COLUMN blood_group TEXT;
ALTER TABLE students ADD COLUMN religion TEXT;
ALTER TABLE students ADD COLUMN caste_category TEXT;
ALTER TABLE students ADD COLUMN previous_school TEXT;
ALTER TABLE students ADD COLUMN transport_route TEXT;
ALTER TABLE students ADD COLUMN transport_stop TEXT;
ALTER TABLE students ADD COLUMN medical_information TEXT;
ALTER TABLE students ADD COLUMN emergency_contact_name TEXT;
ALTER TABLE students ADD COLUMN emergency_contact_phone TEXT;
ALTER TABLE students ADD COLUMN emergency_contact_relation TEXT;

-- Add missing fields to teachers table
ALTER TABLE teachers ADD COLUMN employee_id TEXT UNIQUE;
ALTER TABLE teachers ADD COLUMN department TEXT;
ALTER TABLE teachers ADD COLUMN designation TEXT;
ALTER TABLE teachers ADD COLUMN qualification TEXT;
ALTER TABLE teachers ADD COLUMN experience_years INTEGER;
ALTER TABLE teachers ADD COLUMN salary NUMERIC;
ALTER TABLE teachers ADD COLUMN emergency_contact_name TEXT;
ALTER TABLE teachers ADD COLUMN emergency_contact_phone TEXT;
ALTER TABLE teachers ADD COLUMN emergency_contact_relation TEXT;

-- Add missing fields to parents table
ALTER TABLE parents ADD COLUMN occupation TEXT;
ALTER TABLE parents ADD COLUMN annual_income NUMERIC;
ALTER TABLE parents ADD COLUMN employer_name TEXT;
ALTER TABLE parents ADD COLUMN employer_address TEXT;
ALTER TABLE parents ADD COLUMN alternate_phone TEXT;

-- Add unique constraint for employee_id where it's not null
CREATE UNIQUE INDEX idx_teachers_employee_id ON teachers(employee_id) WHERE employee_id IS NOT NULL;
