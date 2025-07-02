
-- First, let's see what fee types currently exist in the database
SELECT DISTINCT fee_type FROM fees ORDER BY fee_type;
SELECT DISTINCT fee_type FROM student_fee_records ORDER BY fee_type;
SELECT DISTINCT fee_type FROM fee_structures ORDER BY fee_type;

-- Update the database constraint to use standardized fee types with "Fee" suffix
ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_fee_type_check;
ALTER TABLE fees ADD CONSTRAINT fees_fee_type_check CHECK (
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

-- Update fee_structures constraint
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_fee_type_check;
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

-- Update student_fee_records constraint
ALTER TABLE student_fee_records DROP CONSTRAINT IF EXISTS student_fee_records_fee_type_check;
ALTER TABLE student_fee_records ADD CONSTRAINT student_fee_records_fee_type_check CHECK (
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

-- Migrate existing data to standardized fee types
UPDATE fees SET fee_type = 'Tuition Fee' WHERE fee_type IN ('Tuition', 'tuition', 'TUITION');
UPDATE fees SET fee_type = 'Development Fee' WHERE fee_type IN ('Development', 'development', 'DEVELOPMENT');
UPDATE fees SET fee_type = 'Library Fee' WHERE fee_type IN ('Library', 'library', 'LIBRARY');
UPDATE fees SET fee_type = 'Laboratory Fee' WHERE fee_type IN ('Lab', 'Laboratory', 'lab', 'laboratory', 'LAB');
UPDATE fees SET fee_type = 'Sports Fee' WHERE fee_type IN ('Sports', 'sports', 'SPORTS');
UPDATE fees SET fee_type = 'Transport Fee' WHERE fee_type IN ('Transport', 'transport', 'TRANSPORT');
UPDATE fees SET fee_type = 'Exam Fee' WHERE fee_type IN ('Exam', 'exam', 'EXAM');
UPDATE fees SET fee_type = 'Books Fee' WHERE fee_type IN ('Books', 'Book', 'books', 'book');
UPDATE fees SET fee_type = 'Uniform Fee' WHERE fee_type IN ('Uniform', 'uniform', 'UNIFORM');
UPDATE fees SET fee_type = 'Activities Fee' WHERE fee_type IN ('Activities', 'Activity', 'activities', 'activity');
UPDATE fees SET fee_type = 'Meals Fee' WHERE fee_type IN ('Meals', 'Meal', 'meals', 'meal');
UPDATE fees SET fee_type = 'Other Fee' WHERE fee_type IN ('Other', 'other', 'OTHER', 'Misc', 'misc');

-- Migrate student_fee_records
UPDATE student_fee_records SET fee_type = 'Tuition Fee' WHERE fee_type IN ('Tuition', 'tuition', 'TUITION', 'Tuition Fee');
UPDATE student_fee_records SET fee_type = 'Development Fee' WHERE fee_type IN ('Development', 'development', 'DEVELOPMENT');
UPDATE student_fee_records SET fee_type = 'Library Fee' WHERE fee_type IN ('Library', 'library', 'LIBRARY');
UPDATE student_fee_records SET fee_type = 'Laboratory Fee' WHERE fee_type IN ('Lab', 'Laboratory', 'lab', 'laboratory', 'LAB');
UPDATE student_fee_records SET fee_type = 'Sports Fee' WHERE fee_type IN ('Sports', 'sports', 'SPORTS');
UPDATE student_fee_records SET fee_type = 'Transport Fee' WHERE fee_type IN ('Transport', 'transport', 'TRANSPORT');
UPDATE student_fee_records SET fee_type = 'Exam Fee' WHERE fee_type IN ('Exam', 'exam', 'EXAM');
UPDATE student_fee_records SET fee_type = 'Books Fee' WHERE fee_type IN ('Books', 'Book', 'books', 'book');
UPDATE student_fee_records SET fee_type = 'Uniform Fee' WHERE fee_type IN ('Uniform', 'uniform', 'UNIFORM');
UPDATE student_fee_records SET fee_type = 'Activities Fee' WHERE fee_type IN ('Activities', 'Activity', 'activities', 'activity');
UPDATE student_fee_records SET fee_type = 'Meals Fee' WHERE fee_type IN ('Meals', 'Meal', 'meals', 'meal');
UPDATE student_fee_records SET fee_type = 'Other Fee' WHERE fee_type IN ('Other', 'other', 'OTHER', 'Misc', 'misc');

-- Migrate fee_structures
UPDATE fee_structures SET fee_type = 'Tuition Fee' WHERE fee_type IN ('Tuition', 'tuition', 'TUITION');
UPDATE fee_structures SET fee_type = 'Development Fee' WHERE fee_type IN ('Development', 'development', 'DEVELOPMENT');
UPDATE fee_structures SET fee_type = 'Library Fee' WHERE fee_type IN ('Library', 'library', 'LIBRARY');
UPDATE fee_structures SET fee_type = 'Laboratory Fee' WHERE fee_type IN ('Lab', 'Laboratory', 'lab', 'laboratory', 'LAB');
UPDATE fee_structures SET fee_type = 'Sports Fee' WHERE fee_type IN ('Sports', 'sports', 'SPORTS');
UPDATE fee_structures SET fee_type = 'Transport Fee' WHERE fee_type IN ('Transport', 'transport', 'TRANSPORT');
UPDATE fee_structures SET fee_type = 'Exam Fee' WHERE fee_type IN ('Exam', 'exam', 'EXAM');
UPDATE fee_structures SET fee_type = 'Books Fee' WHERE fee_type IN ('Books', 'Book', 'books', 'book');
UPDATE fee_structures SET fee_type = 'Uniform Fee' WHERE fee_type IN ('Uniform', 'uniform', 'UNIFORM');
UPDATE fee_structures SET fee_type = 'Activities Fee' WHERE fee_type IN ('Activities', 'Activity', 'activities', 'activity');
UPDATE fee_structures SET fee_type = 'Meals Fee' WHERE fee_type IN ('Meals', 'Meal', 'meals', 'meal');
UPDATE fee_structures SET fee_type = 'Other Fee' WHERE fee_type IN ('Other', 'other', 'OTHER', 'Misc', 'misc');

-- Migrate payment_history
UPDATE payment_history SET fee_type = 'Tuition Fee' WHERE fee_type IN ('Tuition', 'tuition', 'TUITION');
UPDATE payment_history SET fee_type = 'Development Fee' WHERE fee_type IN ('Development', 'development', 'DEVELOPMENT');
UPDATE payment_history SET fee_type = 'Library Fee' WHERE fee_type IN ('Library', 'library', 'LIBRARY');
UPDATE payment_history SET fee_type = 'Laboratory Fee' WHERE fee_type IN ('Lab', 'Laboratory', 'lab', 'laboratory', 'LAB');
UPDATE payment_history SET fee_type = 'Sports Fee' WHERE fee_type IN ('Sports', 'sports', 'SPORTS');
UPDATE payment_history SET fee_type = 'Transport Fee' WHERE fee_type IN ('Transport', 'transport', 'TRANSPORT');
UPDATE payment_history SET fee_type = 'Exam Fee' WHERE fee_type IN ('Exam', 'exam', 'EXAM');
UPDATE payment_history SET fee_type = 'Books Fee' WHERE fee_type IN ('Books', 'Book', 'books', 'book');
UPDATE payment_history SET fee_type = 'Uniform Fee' WHERE fee_type IN ('Uniform', 'uniform', 'UNIFORM');
UPDATE payment_history SET fee_type = 'Activities Fee' WHERE fee_type IN ('Activities', 'Activity', 'activities', 'activity');
UPDATE payment_history SET fee_type = 'Meals Fee' WHERE fee_type IN ('Meals', 'Meal', 'meals', 'meal');
UPDATE payment_history SET fee_type = 'Other Fee' WHERE fee_type IN ('Other', 'other', 'OTHER', 'Misc', 'misc');
