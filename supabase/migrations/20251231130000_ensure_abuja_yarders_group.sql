-- Ensure "Abuja Yarders" group exists
INSERT INTO public.groups (name, description, created_by)
SELECT 'Abuja Yarders', 'General community for all Abuja Yarders', (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM public.groups WHERE name = 'Abuja Yarders'
);

-- Function to add user to "Abuja Yarders" group
CREATE OR REPLACE FUNCTION public.assign_user_to_general_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  general_group_id uuid;
BEGIN
  -- Find the Abuja Yarders group
  SELECT id INTO general_group_id
  FROM public.groups
  WHERE name = 'Abuja Yarders';
  
  -- Add user if group exists
  IF general_group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (general_group_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (or update existing one)
-- separate trigger to keep logic clean and independent of town logic
DROP TRIGGER IF EXISTS on_profile_created_assign_general_group ON public.profiles;
CREATE TRIGGER on_profile_created_assign_general_group
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_to_general_group();

-- Backfill: Add all existing users to "Abuja Yarders" group
INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, p.id
FROM public.profiles p
CROSS JOIN public.groups g
WHERE g.name = 'Abuja Yarders'
ON CONFLICT DO NOTHING;
