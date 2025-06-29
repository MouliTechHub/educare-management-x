
-- First, let's see what phone number formats currently exist in the database
SELECT phone_number, alternate_phone, COUNT(*) as count
FROM parents 
WHERE phone_number IS NOT NULL 
GROUP BY phone_number, alternate_phone
ORDER BY count DESC;

-- Also check teachers and students tables
SELECT emergency_contact_phone, COUNT(*) as count
FROM students 
WHERE emergency_contact_phone IS NOT NULL 
GROUP BY emergency_contact_phone
ORDER BY count DESC;

SELECT phone_number, emergency_contact_phone, COUNT(*) as count
FROM teachers 
WHERE phone_number IS NOT NULL 
GROUP BY phone_number, emergency_contact_phone
ORDER BY count DESC;
