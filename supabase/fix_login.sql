-- 1. Ensure email column exists in profiles (Fixes invalid type error from before)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Update the password hash to use $2a$ prefix (Supabase GoTrue sometimes prefers this over $2b$)
-- Password: 123456Home
UPDATE auth.users 
SET encrypted_password = '$2a$10$W7mH0b1RjtroFUsRpPt1bOgbYqeeetDzq39CB9QNLOvsxT536VskK'
WHERE email = 'slyokoh@gmail.com';

-- 3. Ensure profile exists for the admin user (slyokoh@gmail.com)
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'slyokoh@gmail.com';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NOT NULL THEN
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
      INSERT INTO public.profiles (id, full_name, role, email)
      VALUES (v_user_id, 'System Admin', 'admin', v_email);
    ELSE
      -- Update email if missing
      UPDATE public.profiles SET email = v_email WHERE id = v_user_id AND email IS NULL;
      -- Ensure role is admin
      UPDATE public.profiles SET role = 'admin' WHERE id = v_user_id AND role != 'admin';
    END IF;
  END IF;
END $$;

-- 4. Verify no other triggers are causing issues
-- (No action needed, just comment)
