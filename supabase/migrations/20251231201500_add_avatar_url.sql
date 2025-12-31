-- Add avatar_url to profiles (since it was missing and needed for birthday display)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
