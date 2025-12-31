-- Remove date_of_birth (which required a year) and replace with explicit day/month columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS date_of_birth;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_month INTEGER CHECK (birth_month BETWEEN 1 AND 12);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_day INTEGER CHECK (birth_day BETWEEN 1 AND 31);

-- Function to handle invalid dates (e.g. Feb 30) handled by application logic, or we could add a trigger, but simple check is enough for now.
