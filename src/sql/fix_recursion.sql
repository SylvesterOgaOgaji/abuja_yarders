-- FIX RECURSION AND 500 ERRORS
-- The 500 errors are caused by Infinite Recursion: "User Roles" policy checking "User Roles" table.
-- We fix this by using a SECURITY DEFINER function that bypasses RLS for the check.

-- 1. Helper Function to avoid recursion (Bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;


-- 2. USER ROLES (The Source of the 500 Error)
-- Drop ALL potential policy names to remove the SQL "policy already exists" error
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Sub-admins can assign seller role" ON public.user_roles;
DROP POLICY IF EXISTS "Everyone can view user roles" ON public.user_roles;

-- Safe READ Policy (No recursion, everyone sees all roles)
CREATE POLICY "Everyone can view user roles"
ON public.user_roles FOR SELECT USING (true);

-- Safe WRITE Policies (Using is_admin function to prevent recursion)
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE USING (is_admin());

-- Sub-admin partial access (Seller creation)
CREATE POLICY "Sub-admins can assign seller role"
ON public.user_roles FOR INSERT
WITH CHECK (
    -- Simple check for sub-admin (avoiding recursion by assuming read policy handles the select)
    -- Or we can trust the 'is_admin' for now. 
    -- To keep it simpler/safer against recursion:
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'sub_admin')
    AND role = 'seller'
);


-- 3. GROUPS (Fix "policy already exists" error)
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Sub-admins/Users view groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Everyone can view groups" ON public.groups;

-- Open Read
CREATE POLICY "Everyone can view groups"
ON public.groups FOR SELECT USING (true);

-- Admin Write
CREATE POLICY "Admins can manage groups"
ON public.groups FOR ALL
USING (is_admin());


-- 4. GROUP MEMBERS
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Everyone can view group memberships" ON public.group_members;

-- Open Read
CREATE POLICY "Everyone can view group memberships"
ON public.group_members FOR SELECT USING (true);


-- 5. DASHBOARD CONTENT
DROP POLICY IF EXISTS "Everyone view dashboard content" ON public.dashboard_content;
DROP POLICY IF EXISTS "Admins can manage dashboard content" ON public.dashboard_content;
DROP POLICY IF EXISTS "Everyone can view dashboard content" ON public.dashboard_content;

-- Open Read
CREATE POLICY "Everyone can view dashboard content"
ON public.dashboard_content FOR SELECT USING (true);

-- Admin Write
CREATE POLICY "Admins can manage dashboard content"
ON public.dashboard_content FOR ALL
USING (is_admin());


-- 6. EXCO MEMBERS
DROP POLICY IF EXISTS "Everyone view exco" ON public.exco_members;
DROP POLICY IF EXISTS "Everyone can view exco" ON public.exco_members;
DROP POLICY IF EXISTS "Admins can manage exco" ON public.exco_members;

-- Open Read
CREATE POLICY "Everyone can view exco"
ON public.exco_members FOR SELECT USING (true);

-- Admin Write
CREATE POLICY "Admins can manage exco"
ON public.exco_members FOR ALL
USING (is_admin());


-- 7. SUPPORT CALLS (Fixing potential 500s here too)
DROP POLICY IF EXISTS "Admins and Sub-admins manage support calls" ON public.support_calls;

CREATE POLICY "Admins and Sub-admins manage support calls"
ON public.support_calls
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'sub_admin')
  )
);
-- Note: Support calls usually doesn't recurse unless we check support_calls. 
-- Since user_roles is now SELECT(true), this is safe.

-- Ensure RLS is active
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exco_members ENABLE ROW LEVEL SECURITY;
