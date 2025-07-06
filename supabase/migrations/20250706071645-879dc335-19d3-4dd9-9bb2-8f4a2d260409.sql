
-- Step 1: First, let's check what tables currently exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 2: Check current data counts before migration
SELECT 
  'fees' as table_name, COUNT(*) as record_count 
FROM fees
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fees' AND table_schema = 'public')
UNION ALL
SELECT 
  'student_fee_records' as table_name, COUNT(*) as record_count 
FROM student_fee_records
UNION ALL
SELECT 
  'payment_history' as table_name, COUNT(*) as record_count 
FROM payment_history
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history' AND table_schema = 'public')
UNION ALL
SELECT 
  'fee_payment_records' as table_name, COUNT(*) as record_count 
FROM fee_payment_records;

-- Step 3: Migrate fees data to student_fee_records (only if fees table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fees' AND table_schema = 'public') THEN
    INSERT INTO student_fee_records (
      student_id,
      class_id,
      academic_year_id,
      fee_type,
      actual_fee,
      discount_amount,
      paid_amount,
      due_date,
      status,
      created_at,
      updated_at,
      discount_notes,
      discount_updated_by,
      discount_updated_at
    )
    SELECT DISTINCT
      f.student_id,
      s.class_id,
      f.academic_year_id,
      f.fee_type,
      f.actual_amount,
      f.discount_amount,
      f.total_paid,
      f.due_date,
      f.status,
      f.created_at,
      f.updated_at,
      f.discount_notes,
      f.discount_updated_by,
      f.discount_updated_at
    FROM fees f
    JOIN students s ON f.student_id = s.id
    WHERE NOT EXISTS (
      SELECT 1 FROM student_fee_records sfr 
      WHERE sfr.student_id = f.student_id 
      AND sfr.academic_year_id = f.academic_year_id 
      AND sfr.fee_type = f.fee_type
    );
    
    RAISE NOTICE 'Migrated fees data to student_fee_records';
  ELSE
    RAISE NOTICE 'Fees table does not exist, skipping migration';
  END IF;
END $$;

-- Step 4: Migrate payment_history to fee_payment_records (only if payment_history exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history' AND table_schema = 'public') THEN
    INSERT INTO fee_payment_records (
      fee_record_id,
      student_id,
      amount_paid,
      payment_date,
      payment_time,
      payment_method,
      receipt_number,
      payment_receiver,
      notes,
      created_by,
      created_at
    )
    SELECT DISTINCT
      sfr.id as fee_record_id,
      ph.student_id,
      ph.amount_paid,
      ph.payment_date,
      ph.payment_time,
      ph.payment_method,
      ph.receipt_number,
      ph.payment_receiver,
      ph.notes,
      'System Migration' as created_by,
      ph.created_at
    FROM payment_history ph
    JOIN student_fee_records sfr ON (
      ph.student_id = sfr.student_id 
      AND ph.fee_type = sfr.fee_type
    )
    WHERE NOT EXISTS (
      SELECT 1 FROM fee_payment_records fpr 
      WHERE fpr.student_id = ph.student_id 
      AND fpr.receipt_number = ph.receipt_number
      AND fpr.payment_date = ph.payment_date
    );
    
    RAISE NOTICE 'Migrated payment_history to fee_payment_records';
  ELSE
    RAISE NOTICE 'Payment_history table does not exist, skipping migration';
  END IF;
END $$;

-- Step 5: Update references in discount_history
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fees' AND table_schema = 'public') THEN
    UPDATE discount_history 
    SET source_fee_id = sfr.id,
        source_table = 'student_fee_records'
    FROM student_fee_records sfr
    JOIN fees f ON (
      sfr.student_id = f.student_id 
      AND sfr.academic_year_id = f.academic_year_id 
      AND sfr.fee_type = f.fee_type
    )
    WHERE discount_history.fee_id = f.id
    AND (discount_history.source_table = 'fees' OR discount_history.source_table IS NULL);
    
    RAISE NOTICE 'Updated discount_history references';
  END IF;
END $$;

-- Step 6: Drop tables that exist (with safety checks)
DO $$
BEGIN
  -- Drop tables only if they exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fees_backup' AND table_schema = 'public') THEN
    DROP TABLE fees_backup CASCADE;
    RAISE NOTICE 'Dropped fees_backup table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fee_discounts' AND table_schema = 'public') THEN
    DROP TABLE fee_discounts CASCADE;
    RAISE NOTICE 'Dropped fee_discounts table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_fee_assignments' AND table_schema = 'public') THEN
    DROP TABLE student_fee_assignments CASCADE;
    RAISE NOTICE 'Dropped student_fee_assignments table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_payments' AND table_schema = 'public') THEN
    DROP TABLE student_payments CASCADE;
    RAISE NOTICE 'Dropped student_payments table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments' AND table_schema = 'public') THEN
    DROP TABLE payments CASCADE;
    RAISE NOTICE 'Dropped payments table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history' AND table_schema = 'public') THEN
    DROP TABLE payment_history CASCADE;
    RAISE NOTICE 'Dropped payment_history table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fees' AND table_schema = 'public') THEN
    DROP TABLE fees CASCADE;
    RAISE NOTICE 'Dropped fees table';
  END IF;
END $$;

-- Step 7: Verify tables were dropped
SELECT 
  'Tables remaining after cleanup:' as status,
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('fees', 'payment_history', 'fees_backup', 'fee_discounts', 'student_fee_assignments', 'student_payments', 'payments')
ORDER BY table_name;

-- Step 8: Final verification - show record counts
SELECT 
  'student_fee_records' as table_name, 
  COUNT(*) as final_record_count 
FROM student_fee_records
UNION ALL
SELECT 
  'fee_payment_records' as table_name, 
  COUNT(*) as final_record_count 
FROM fee_payment_records;
