-- Insert a new user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_current,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  ''
);

-- Get the user ID we just created and create profile
DO $$ 
DECLARE 
  new_user_id uuid;
BEGIN
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@example.com';
  
  -- Insert into profiles with admin role
  INSERT INTO profiles (id, role)
  VALUES (new_user_id, 'admin');
END $$;

-- Verify the user was created
SELECT u.email, p.role 
FROM auth.users u 
JOIN profiles p ON u.id = p.id 
WHERE u.email = 'admin@example.com'; 