-- Add Email column to Profiles and Backfill
-- Also FIXES handle_new_user to ensure all fields (town, phone, email) are inserted.

DO $$
BEGIN
    -- 1. Add email column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;

    -- 2. Backfill email from auth.users
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id AND p.email IS NULL;
END $$;

-- 3. Update the handle_new_user function to include email AND preserve town/phone/etc
-- Previous versions might have dropped town/phone, causing bugs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
      id, 
      full_name, 
      role, 
      email, 
      avatar_url, 
      phone_number, 
      town, 
      area_council
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    'user', -- Default role
    new.email, -- Added this
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'town',
    new.raw_user_meta_data->>'area_council'
  );
  RETURN new;
END;
$function$;
