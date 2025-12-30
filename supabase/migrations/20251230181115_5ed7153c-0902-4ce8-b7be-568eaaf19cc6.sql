
-- Create the general "Abuja Yarders" group
INSERT INTO public.groups (name, description, created_by) VALUES
('Abuja Yarders', 'General community for all Yarders in Abuja FCT', (SELECT id FROM auth.users LIMIT 1));

-- Update the trigger function to also add users to the general group
CREATE OR REPLACE FUNCTION public.assign_user_to_town_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_name text;
  target_group_id uuid;
  general_group_id uuid;
BEGIN
  -- Always add user to the general "Abuja Yarders" group
  SELECT id INTO general_group_id
  FROM public.groups
  WHERE name = 'Abuja Yarders';
  
  IF general_group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (general_group_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Also add to their town-specific group if they have a town set
  IF NEW.town IS NOT NULL AND NEW.town != '' THEN
    group_name := get_group_name_for_town(NEW.town);
    
    SELECT id INTO target_group_id
    FROM public.groups
    WHERE name = group_name;
    
    IF target_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, user_id)
      VALUES (target_group_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add all existing users to the general Abuja Yarders group
INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, p.id
FROM public.profiles p
CROSS JOIN public.groups g
WHERE g.name = 'Abuja Yarders'
ON CONFLICT DO NOTHING;
