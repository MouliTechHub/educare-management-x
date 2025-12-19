-- Create profile for existing user
INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
  '7e51076c-3cec-4cd7-856b-e31afb89bc13',
  'v.leelasai@gmail.com',
  'Admin',
  'User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Assign admin role in user_roles table
INSERT INTO public.user_roles (user_id, role, assigned_at, assigned_by, is_active)
VALUES (
  '7e51076c-3cec-4cd7-856b-e31afb89bc13',
  'admin',
  NOW(),
  'system',
  true
)
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;