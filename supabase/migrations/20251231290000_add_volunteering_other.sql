-- Add volunteering_other_description to profiles table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'volunteering_other_description') THEN
        ALTER TABLE public.profiles ADD COLUMN volunteering_other_description text;
    END IF;
END $$;
