-- Ensure there is at least one user to own the groups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'slyokoh@gmail.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'slyokoh@gmail.com',
      '$2b$10$W7mH0b1RjtroFUsRpPt1bOgbYqeeetDzq39CB9QNLOvsxT536VskK', -- 123456Home
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Admin"}',
      now(),
      now()
    );
  END IF;
END $$;

-- First, delete all existing data from related tables
DELETE FROM public.bid_notifications;
DELETE FROM public.bid_offers;
DELETE FROM public.bids;
DELETE FROM public.message_reactions;
DELETE FROM public.media_uploads;
DELETE FROM public.messages;
DELETE FROM public.group_members;
DELETE FROM public.groups;

-- Helper to get the admin ID
-- We use a CTE or variable in a real script, but for bulk insert simple subquery is fine provided it finds the user we just ensured exists.
-- We'll use COALESCE to fallback to *any* user if something goes weird, but prefer slyokoh.

INSERT INTO public.groups (name, description, created_by) VALUES
-- AMAC Towns (11 groups)
('Wuse Yarders', 'Community for Yarders in Wuse, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Garki Yarders', 'Community for Yarders in Garki, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Maitama Yarders', 'Community for Yarders in Maitama, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Asokoro Yarders', 'Community for Yarders in Asokoro, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Utako Yarders', 'Community for Yarders in Utako, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Jabi Yarders', 'Community for Yarders in Jabi, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Lugbe Yarders', 'Community for Yarders in Lugbe, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Gwarinpa Yarders', 'Community for Yarders in Gwarinpa, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Apo Yarders', 'Community for Yarders in Apo, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Nyanya Yarders', 'Community for Yarders in Nyanya, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Karu Yarders', 'Community for Yarders in Karu, AMAC', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),

-- Gwagwalada Towns (5 groups)
('Dobi Yarders', 'Community for Yarders in Dobi, Gwagwalada', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Zuba Yarders', 'Community for Yarders in Zuba, Gwagwalada', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Paiko Yarders', 'Community for Yarders in Paiko, Gwagwalada', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Kutunku Yarders', 'Community for Yarders in Kutunku, Gwagwalada', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Gwagwalada Town Yarders', 'Community for Yarders in Gwagwalada Town', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),

-- Kuje Towns (5 groups)
('Kuje Town Yarders', 'Community for Yarders in Kuje Town', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Rubochi Yarders', 'Community for Yarders in Rubochi, Kuje', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Gwagwalada Road Axis Yarders', 'Community for Yarders in Gwagwalada Road Axis, Kuje', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Chibiri Yarders', 'Community for Yarders in Chibiri, Kuje', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Gwargwada Yarders', 'Community for Yarders in Gwargwada, Kuje', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),

-- Bwari Towns (5 groups)
('Bwari Town Yarders', 'Community for Yarders in Bwari Town', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Dutse Yarders', 'Community for Yarders in Dutse, Bwari', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Kubwa Yarders', 'Community for Yarders in Kubwa, Bwari', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Byazhin Yarders', 'Community for Yarders in Byazhin, Bwari', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Ushafa Yarders', 'Community for Yarders in Ushafa, Bwari', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),

-- Abaji Towns (4 groups)
('Abaji Town Yarders', 'Community for Yarders in Abaji Town', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Pandagi Yarders', 'Community for Yarders in Pandagi, Abaji', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Gurdi Yarders', 'Community for Yarders in Gurdi, Abaji', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Rimba Yarders', 'Community for Yarders in Rimba, Abaji', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),

-- Kwali Towns (3 groups)
('Kwali Town Yarders', 'Community for Yarders in Kwali Town', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Pai Yarders', 'Community for Yarders in Pai, Kwali', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1)),
('Sheda Yarders', 'Community for Yarders in Sheda, Kwali', (SELECT id FROM auth.users WHERE email = 'slyokoh@gmail.com' LIMIT 1));

-- Create function to get group name from town
CREATE OR REPLACE FUNCTION public.get_group_name_for_town(town_name text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE town_name
    -- Handle special cases where group name differs from town name
    WHEN 'Gwagwalada Town' THEN 'Gwagwalada Town Yarders'
    WHEN 'Kuje Town' THEN 'Kuje Town Yarders'
    WHEN 'Bwari Town' THEN 'Bwari Town Yarders'
    WHEN 'Abaji Town' THEN 'Abaji Town Yarders'
    WHEN 'Kwali Town' THEN 'Kwali Town Yarders'
    ELSE town_name || ' Yarders'
  END
$$;

-- Create trigger function to auto-assign user to group based on their town
CREATE OR REPLACE FUNCTION public.assign_user_to_town_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_name text;
  target_group_id uuid;
BEGIN
  -- Only proceed if the user has a town set
  IF NEW.town IS NOT NULL AND NEW.town != '' THEN
    -- Get the group name for this town
    group_name := get_group_name_for_town(NEW.town);
    
    -- Find the group
    SELECT id INTO target_group_id
    FROM public.groups
    WHERE name = group_name;
    
    -- If group exists and user is not already a member, add them
    IF target_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, user_id)
      VALUES (target_group_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for new users
DROP TRIGGER IF EXISTS on_profile_created_assign_group ON public.profiles;
CREATE TRIGGER on_profile_created_assign_group
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_to_town_group();

-- Also create trigger for when user updates their town (optional, for migration)
DROP TRIGGER IF EXISTS on_profile_updated_assign_group ON public.profiles;
CREATE TRIGGER on_profile_updated_assign_group
  AFTER UPDATE OF town ON public.profiles
  FOR EACH ROW
  WHEN (OLD.town IS DISTINCT FROM NEW.town)
  EXECUTE FUNCTION public.assign_user_to_town_group();

-- Assign existing users to their town groups
INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, p.id
FROM public.profiles p
JOIN public.groups g ON g.name = public.get_group_name_for_town(p.town)
WHERE p.town IS NOT NULL AND p.town != ''
ON CONFLICT DO NOTHING;
