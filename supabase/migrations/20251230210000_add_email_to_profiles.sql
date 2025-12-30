-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Backfill email for existing users (This might fail if run in a transaction with other things in some environments if auth.users is not accessible directly in the same way, but usually valid in supabase migrations)
-- We'll use a DO block to be safe and handle potential permission issues gracefully or just rely on the fact that this is a superuser migration
DO $$
BEGIN
  -- We cannot easily select from auth.users in a pure SQL migration if permissions aren't set, 
  -- but usually migrations run as superuser/postgres.
  
  -- Update profiles with email from auth.users
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.email IS NULL;
END $$;
