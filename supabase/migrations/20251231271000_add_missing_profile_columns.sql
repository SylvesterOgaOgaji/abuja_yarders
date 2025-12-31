-- Add missing columns to profiles table to support Profile.tsx queries
-- All adds are safe (IF NOT EXISTS logic via checking information_schema or just simple ALTER TABLE which fails if exists? use explicit checks)

DO $$
BEGIN
    -- Add confirmation_agreement
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'confirmation_agreement') THEN
        ALTER TABLE public.profiles ADD COLUMN confirmation_agreement boolean DEFAULT false;
    END IF;

    -- Add volunteering_capacity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'volunteering_capacity') THEN
        ALTER TABLE public.profiles ADD COLUMN volunteering_capacity text;
    END IF;

    -- Add commitment_followup_scale
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commitment_followup_scale') THEN
        ALTER TABLE public.profiles ADD COLUMN commitment_followup_scale integer;
    END IF;

    -- Add commitment_financial_scale
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commitment_financial_scale') THEN
        ALTER TABLE public.profiles ADD COLUMN commitment_financial_scale integer;
    END IF;
    
    -- Add bio if missing (already seemingly handled but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;

    -- Add years_in_yard if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'years_in_yard') THEN
        ALTER TABLE public.profiles ADD COLUMN years_in_yard text;
    END IF;

END $$;
