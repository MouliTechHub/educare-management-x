-- Check current RLS policies on classes table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'classes';

-- Drop any restrictive RLS policies on classes table if they exist
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.classes;

-- Create a proper RLS policy for classes table
CREATE POLICY "Enable all operations for authenticated users" ON public.classes
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Make sure RLS is enabled on classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;