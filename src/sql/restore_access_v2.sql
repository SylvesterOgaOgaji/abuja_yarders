-- RESTORE ACCESS V2 (FORCE OPEN)
-- The previous permissions were too strict. This script opens READ access to everyone to restore functionality.

-- 1. FORCE ADMIN ROLE (Just in case it was lost)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'slyokoh@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Insert admin role if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;


-- 2. RESET POLICIES (Drop everything related to READ)

-- GROUPS
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Sub-admins/Users view groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
-- Force Open Read
CREATE POLICY "Everyone can view groups"
ON public.groups FOR SELECT USING (true);
CREATE POLICY "Admins can manage groups"
ON public.groups FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- GROUP MEMBERS
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
-- Force Open Read
CREATE POLICY "Everyone can view group memberships"
ON public.group_members FOR SELECT USING (true);


-- EXCO MEMBERS
DROP POLICY IF EXISTS "Everyone view exco" ON public.exco_members;
DROP POLICY IF EXISTS "Admins can manage exco" ON public.exco_members;
-- Force Open Read
CREATE POLICY "Everyone can view exco"
ON public.exco_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage exco"
ON public.exco_members FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);


-- USER ROLES (The most critical one)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Sub-admins can assign seller role" ON public.user_roles;

-- Force Open Read (Users can see all roles - safe for now to debug)
CREATE POLICY "Everyone can view user roles"
ON public.user_roles FOR SELECT USING (true);

-- Admin Management (Recursive check - ensure we have a fallback or break recursion)
-- For now, let's allow admins to manage, but the SELECT policy above handles the visibility.
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Sub-admin Insert
CREATE POLICY "Sub-admins can assign seller role"
ON public.user_roles FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'sub_admin')
    AND role = 'seller'
);


-- DASHBOARD CONTENT
DROP POLICY IF EXISTS "Everyone view dashboard content" ON public.dashboard_content;
DROP POLICY IF EXISTS "Admins can manage dashboard content" ON public.dashboard_content;
-- Force Open Read
CREATE POLICY "Everyone can view dashboard content"
ON public.dashboard_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage dashboard content"
ON public.dashboard_content FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);


-- 3. VERIFY RLS IS ENABLED (Should be, but ensuring)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exco_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_content ENABLE ROW LEVEL SECURITY;
