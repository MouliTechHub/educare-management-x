-- Phase 1: Critical Security Fixes (Fixed version)

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent', 'accountant');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by TEXT DEFAULT 'System',
    is_active BOOLEAN DEFAULT true,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
    AND is_active = true 
  LIMIT 1;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(check_role app_role, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
      AND role = check_role 
      AND is_active = true
  );
$$;

-- Create function to check if user has admin role (commonly used)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.has_role('admin'::app_role, user_uuid);
$$;

-- Create function to check if user has accountant or admin role
CREATE OR REPLACE FUNCTION public.can_manage_finances(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
      AND role IN ('admin', 'accountant') 
      AND is_active = true
  );
$$;

-- Update profiles RLS policies for better security
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Only allow users to see their own profile or admins to see all
CREATE POLICY "Users can view own profile, admins view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  public.is_admin()
);

-- Only allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow system to insert profiles for new users
CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Update students RLS for role-based access
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.students;

CREATE POLICY "Role-based student access" 
ON public.students 
FOR SELECT 
USING (
  public.is_admin() OR 
  public.has_role('teacher'::app_role) OR 
  public.has_role('accountant'::app_role) OR
  -- Parents can only see their own children
  (public.has_role('parent'::app_role) AND 
   EXISTS (
     SELECT 1 FROM public.student_parent_links spl 
     JOIN public.parents p ON spl.parent_id = p.id
     JOIN public.profiles pr ON pr.id = auth.uid()
     WHERE spl.student_id = students.id 
       AND (p.email = pr.email OR p.phone_number = pr.email)
   ))
);

CREATE POLICY "Admins can modify students" 
ON public.students 
FOR ALL 
USING (public.is_admin());

-- Update fee records RLS for better security
DROP POLICY IF EXISTS "Allow all for authenticated users student_fee_records" ON public.student_fee_records;

CREATE POLICY "Role-based fee records access" 
ON public.student_fee_records 
FOR SELECT 
USING (
  public.can_manage_finances() OR
  -- Parents can only see their children's fee records
  (public.has_role('parent'::app_role) AND 
   EXISTS (
     SELECT 1 FROM public.student_parent_links spl 
     JOIN public.parents p ON spl.parent_id = p.id
     JOIN public.profiles pr ON pr.id = auth.uid()
     WHERE spl.student_id = student_fee_records.student_id 
       AND (p.email = pr.email OR p.phone_number = pr.email)
   ))
);

CREATE POLICY "Finance managers can modify fee records" 
ON public.student_fee_records 
FOR ALL 
USING (public.can_manage_finances());

-- Update payment records RLS
DROP POLICY IF EXISTS "Allow all for authenticated users fee_payment_records" ON public.fee_payment_records;

CREATE POLICY "Role-based payment records access" 
ON public.fee_payment_records 
FOR SELECT 
USING (
  public.can_manage_finances() OR
  -- Parents can only see their children's payment records
  (public.has_role('parent'::app_role) AND 
   EXISTS (
     SELECT 1 FROM public.student_parent_links spl 
     JOIN public.parents p ON spl.parent_id = p.id
     JOIN public.profiles pr ON pr.id = auth.uid()
     WHERE spl.student_id = fee_payment_records.student_id 
       AND (p.email = pr.email OR p.phone_number = pr.email)
   ))
);

CREATE POLICY "Finance managers can create payments" 
ON public.fee_payment_records 
FOR INSERT 
WITH CHECK (public.can_manage_finances());

-- Update handle_new_user function for better security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Admin')
  );
  
  -- Assign default role based on email or metadata
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'admin@schoolmaster.com' THEN 'admin'::app_role
      ELSE COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'admin'::app_role)
    END,
    'System'
  );
  
  RETURN NEW;
END;
$$;

-- Add RLS policies for user_roles table
CREATE POLICY "Users can view own roles, admins view all" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.is_admin()
);

CREATE POLICY "Only admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin());

-- Add audit logging for sensitive operations
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_admin());

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO public.security_audit_log (
        user_id, action, resource_type, resource_id, details
    )
    VALUES (
        auth.uid(), p_action, p_resource_type, p_resource_id, p_details
    )
    RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;