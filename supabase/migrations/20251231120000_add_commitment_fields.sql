-- Add commitment and confirmation columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS commitment_followup_scale INTEGER CHECK (commitment_followup_scale BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS commitment_financial_scale INTEGER CHECK (commitment_financial_scale BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS volunteering_capacity TEXT,
ADD COLUMN IF NOT EXISTS confirmation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_agreement BOOLEAN DEFAULT FALSE;

-- Update the handle_new_user function to include these new fields
-- We need to drop user roles trigger/policy might not be affected but let's be safe and just replace the function body
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    email,
    commitment_followup_scale,
    commitment_financial_scale,
    volunteering_capacity,
    confirmation_date,
    confirmation_agreement
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user',
    NEW.email,
    (NEW.raw_user_meta_data->>'commitment_followup_scale')::INTEGER,
    (NEW.raw_user_meta_data->>'commitment_financial_scale')::INTEGER,
    NEW.raw_user_meta_data->>'volunteering_capacity',
    CASE 
      WHEN (NEW.raw_user_meta_data->>'confirmation_date')::text IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'confirmation_date')::timestamptz 
      ELSE NOW() 
    END,
    (NEW.raw_user_meta_data->>'confirmation_agreement')::boolean
  );
  RETURN NEW;
END;
$$;
