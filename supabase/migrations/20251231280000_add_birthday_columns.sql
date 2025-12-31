-- Add birthday columns to profiles table to resolve 400 Bad Request error
-- Based on the error log: profiles?select=...birth_day,birth_month...

DO $$
BEGIN
    -- Add birth_day
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_day') THEN
        ALTER TABLE public.profiles ADD COLUMN birth_day integer;
    END IF;

    -- Add birth_month
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_month') THEN
        ALTER TABLE public.profiles ADD COLUMN birth_month text;
    END IF;

    -- Ensure other columns from Profile.tsx are present (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;

END $$;
