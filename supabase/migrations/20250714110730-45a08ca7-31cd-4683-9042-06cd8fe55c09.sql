-- Enable replica identity for fee tables to capture complete row data during updates
-- This ensures that real-time subscriptions receive complete row information
ALTER TABLE public.student_fee_records REPLICA IDENTITY FULL;
ALTER TABLE public.fee_payment_records REPLICA IDENTITY FULL;
ALTER TABLE public.payment_allocations REPLICA IDENTITY FULL;