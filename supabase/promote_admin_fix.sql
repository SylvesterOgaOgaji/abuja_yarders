-- Promote slyokoh@gmail.com to Admin correctly
-- The application uses the `user_roles` table for permission checks, not just `profiles`.

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'slyokoh@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- 1. Insert admin role into user_roles table
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 2. Update profiles table just in case (legacy support)
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = v_user_id;
    
  ELSE
    RAISE NOTICE 'User slyokoh@gmail.com not found';
  END IF;
END $$;

-- Verify the roles
SELECT * FROM public.user_roles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com');
