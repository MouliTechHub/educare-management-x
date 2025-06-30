
-- Add time column to payment_history table to track exact payment time
ALTER TABLE public.payment_history 
ADD COLUMN IF NOT EXISTS payment_time TIME DEFAULT CURRENT_TIME;

-- Update the payment_time column to be NOT NULL with current time as default
ALTER TABLE public.payment_history 
ALTER COLUMN payment_time SET NOT NULL;

-- Add an index for better query performance on payment_date and payment_time
CREATE INDEX IF NOT EXISTS idx_payment_history_datetime ON public.payment_history(payment_date, payment_time);

-- Update existing records to have a default time if they don't have one
UPDATE public.payment_history 
SET payment_time = CURRENT_TIME 
WHERE payment_time IS NULL;
