-- Add missing notes column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the expenses table to ensure it has all required columns
-- Add receipt_url if it doesn't exist (should already exist)
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Add created_by if it doesn't exist (should already exist)  
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Admin';

-- Update payment_method column name to match the interface (payment_mode vs payment_method)
-- Check if payment_mode column exists and rename it if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'expenses' AND column_name = 'payment_mode') THEN
    ALTER TABLE public.expenses RENAME COLUMN payment_mode TO payment_method;
  END IF;
END $$;