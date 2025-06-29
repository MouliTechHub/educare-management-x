
-- Check existing phone number data in all tables to understand the current formats
SELECT 'parents' as table_name, phone_number, alternate_phone, COUNT(*) as count
FROM parents 
WHERE phone_number IS NOT NULL 
GROUP BY phone_number, alternate_phone
ORDER BY count DESC
LIMIT 10;

-- Check if there are any phone numbers that don't match the new pattern
SELECT 'parents_invalid' as table_name, phone_number, 
       CASE 
         WHEN phone_number !~ '^\+91[0-9]{10}$' THEN 'Invalid format'
         ELSE 'Valid'
       END as status
FROM parents 
WHERE phone_number IS NOT NULL 
  AND phone_number !~ '^\+91[0-9]{10}$'
LIMIT 5;

-- Check teachers table
SELECT 'teachers_invalid' as table_name, phone_number,
       CASE 
         WHEN phone_number !~ '^\+91[0-9]{10}$' THEN 'Invalid format'
         ELSE 'Valid'
       END as status
FROM teachers 
WHERE phone_number IS NOT NULL 
  AND phone_number !~ '^\+91[0-9]{10}$'
LIMIT 5;

-- Check students table
SELECT 'students_invalid' as table_name, emergency_contact_phone,
       CASE 
         WHEN emergency_contact_phone !~ '^\+91[0-9]{10}$' THEN 'Invalid format'
         ELSE 'Valid'
       END as status
FROM students 
WHERE emergency_contact_phone IS NOT NULL 
  AND emergency_contact_phone !~ '^\+91[0-9]{10}$'
LIMIT 5;
