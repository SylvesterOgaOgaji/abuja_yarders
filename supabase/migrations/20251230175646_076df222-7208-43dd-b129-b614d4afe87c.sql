-- Add new profile fields for census data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS years_in_yard TEXT,
ADD COLUMN IF NOT EXISTS area_council TEXT,
ADD COLUMN IF NOT EXISTS town TEXT;