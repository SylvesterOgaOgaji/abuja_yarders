
-- Function to automatically add new admins/sub-admins to all groups
CREATE OR REPLACE FUNCTION public.add_admin_to_all_groups()
RETURNS TRIGGER AS $$
DECLARE
  group_record RECORD;
BEGIN
  -- Check if the new role is 'admin' or 'sub_admin'
  IF NEW.role IN ('admin', 'sub_admin') THEN
    -- Iterate through all existing groups
    FOR group_record IN SELECT id FROM public.groups LOOP
      -- Insert into group_members if not already exists
      INSERT INTO public.group_members (group_id, user_id)
      VALUES (group_record.id, NEW.user_id)
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run when a user role is assigned
DROP TRIGGER IF EXISTS on_admin_role_assigned ON public.user_roles;
CREATE TRIGGER on_admin_role_assigned
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.add_admin_to_all_groups();

-- Function to add all existing admins/sub-admins to all groups (Maintenance script)
CREATE OR REPLACE FUNCTION public.sync_admins_to_all_groups()
RETURNS void AS $$
DECLARE
  admin_user RECORD;
  group_record RECORD;
BEGIN
  -- Iterate through all users with admin/sub_admin roles
  FOR admin_user IN SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sub_admin') LOOP
    -- Iterate through all groups
    FOR group_record IN SELECT id FROM public.groups LOOP
      -- Insert into group_members if not already exists
      INSERT INTO public.group_members (group_id, user_id)
      VALUES (group_record.id, admin_user.user_id)
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the sync immediately to fix current state
SELECT public.sync_admins_to_all_groups();
