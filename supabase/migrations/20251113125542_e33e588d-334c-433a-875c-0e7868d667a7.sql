-- Make all groups visible to all authenticated users
-- Users should be able to see all groups even if they're not members yet

-- Update RLS policy for groups to allow all authenticated users to view all groups
DROP POLICY IF EXISTS "Users can view all groups" ON public.groups;

CREATE POLICY "Authenticated users can view all groups"
ON public.groups
FOR SELECT
TO authenticated
USING (true);

-- Update group_members RLS to allow viewing all members
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

CREATE POLICY "Authenticated users can view all group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);