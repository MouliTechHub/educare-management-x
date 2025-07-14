-- Enable real-time functionality for fee-related tables
-- This ensures that changes to fee records and payments are reflected immediately in the UI

-- Enable replica identity for fee tables to capture complete row data during updates
ALTER TABLE public.student_fee_records REPLICA IDENTITY FULL;
ALTER TABLE public.fee_payment_records REPLICA IDENTITY FULL;
ALTER TABLE public.payment_allocations REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication to activate real-time functionality
-- This allows the frontend to receive real-time updates when data changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_fee_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_payment_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_allocations;