-- Restore admin role for the admin user
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Try to find the admin user by email in auth.users
  SELECT id INTO admin_id
  FROM auth.users 
  WHERE lower(email) = 'admin@schoolmaster.com'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Fallback: look in public.profiles if not found
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id
    FROM public.profiles
    WHERE lower(email) = 'admin@schoolmaster.com'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Final fallback: known admin id from recent activity (safe if exists)
  IF admin_id IS NULL THEN
    admin_id := '8da8fceb-766d-402e-93ea-8943061d3c65'::uuid;
  END IF;

  IF admin_id IS NOT NULL THEN
    -- Upsert admin role; reactivate if present
    IF EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = admin_id AND role = 'admin'
    ) THEN
      UPDATE public.user_roles
      SET is_active = true, assigned_by = 'System', assigned_at = now()
      WHERE user_id = admin_id AND role = 'admin';
    ELSE
      INSERT INTO public.user_roles (user_id, role, is_active, assigned_by)
      VALUES (admin_id, 'admin', true, 'System');
    END IF;
  END IF;
END $$;