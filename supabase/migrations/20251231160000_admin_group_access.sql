-- 1. Backfill: Add existing Admins to ALL existing Groups
INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, p.id
FROM public.groups g
CROSS JOIN public.profiles p
WHERE p.role = 'admin'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 2. Trigger: When a NEW GROUP is created, add all Admins to it
CREATE OR REPLACE FUNCTION public.add_admins_to_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id)
  SELECT NEW.id, p.id
  FROM public.profiles p
  WHERE p.role = 'admin'
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created_add_admins ON public.groups;
CREATE TRIGGER on_group_created_add_admins
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_admins_to_new_group();

-- 3. Trigger: When a user becomes an ADMIN, add them to all Groups
CREATE OR REPLACE FUNCTION public.add_new_admin_to_all_groups()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if role changed to 'admin'
  IF (OLD.role IS DISTINCT FROM 'admin' AND NEW.role = 'admin') THEN
    INSERT INTO public.group_members (group_id, user_id)
    SELECT g.id, NEW.id
    FROM public.groups g
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change_add_groups ON public.profiles;
CREATE TRIGGER on_profile_role_change_add_groups
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.add_new_admin_to_all_groups();
