-- Fix the fee_payment_records constraint issue by making fee_record_id nullable
-- This allows the FIFO allocation system to work properly
ALTER TABLE public.fee_payment_records 
ALTER COLUMN fee_record_id DROP NOT NULL;