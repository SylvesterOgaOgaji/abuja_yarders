-- EMERGENCY ACCESS RESTORATION
-- Use this script to fix "Lost Admin Access" and "Content Not Loading" issues immediately.

-- 1. FIX USER ROLES VISIBILITY (Critical for Admin Dashboard)
-- Users MUST be able to read their own roles to know if they are admins.
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
-- Also drop potentially conflicting policies restricting SELECT
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles; 

-- Re-create the Admin Full Access Policy
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- CREATE THE MISSING POLICY: allow users to read their own role
CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);


-- 2. FIX DASHBOARD CONTENT VISIBILITY (Announcements/Events)
DROP POLICY IF EXISTS "Everyone view dashboard content" ON public.dashboard_content;
DROP POLICY IF EXISTS "Admins can manage dashboard content" ON public.dashboard_content;

-- Allow everyone to read content
CREATE POLICY "Everyone view dashboard content"
ON public.dashboard_content
FOR SELECT
USING (true);

-- Allow admins to manage content
CREATE POLICY "Admins can manage dashboard content"
ON public.dashboard_content
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);


-- 3. FIX GROUPS VISIBILITY (Chat Groups)
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;

-- Allow everyone to see list of groups
CREATE POLICY "Authenticated users can view groups"
ON public.groups
FOR SELECT
TO authenticated
USING (true);

-- Allow everyone to see who is in what group (needed for "My Groups" logic)
CREATE POLICY "Users can view group memberships"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);


-- 4. ENABLE RLS (Ensure it's on, but policies exist)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
