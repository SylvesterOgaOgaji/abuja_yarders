-- RESTRICT SUB-ADMIN PERMISSIONS (Revised for Idempotency)

-- 1. Ban Requests: Sub-Admins can VIEW, but cannot INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can manage ban requests" ON public.ban_requests;
DROP POLICY IF EXISTS "Sub-admins can view ban requests" ON public.ban_requests;

-- Full access for 'admin'
CREATE POLICY "Admins can manage ban requests"
ON public.ban_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Read-only for 'sub_admin'
CREATE POLICY "Sub-admins can view ban requests"
ON public.ban_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'sub_admin'
  )
);


-- 2. User Roles: Prevent Sub-Admins from creating other Sub-Admins
DROP POLICY IF EXISTS "Admins and Sub-admins can manage user roles" ON public.user_roles;
-- FIX: Drop the new policies we want to create as well, in case they exist from a partial run
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Sub-admins can assign seller role" ON public.user_roles;

-- Admins: Do anything
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

-- Sub-Admins: Can only INSERT 'seller' role
CREATE POLICY "Sub-admins can assign seller role"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'sub_admin'
  )
  AND role = 'seller' -- ONLY allow assigning 'seller'
);


-- 3. Groups (Towns): Sub-Admins VIEW ONLY
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Sub-admins can view groups" ON public.groups;
-- Drop potentially conflicting old policies
DROP POLICY IF EXISTS "Sub-admins/Users view groups" ON public.groups;

CREATE POLICY "Admins can manage groups"
ON public.groups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Sub-admins/Users view groups"
ON public.groups
FOR SELECT
USING (true);


-- 4. Exco Members: Sub-Admins VIEW ONLY
DROP POLICY IF EXISTS "Admins can manage exco" ON public.exco_members;
DROP POLICY IF EXISTS "Everyone view exco" ON public.exco_members;

CREATE POLICY "Admins can manage exco"
ON public.exco_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Everyone view exco"
ON public.exco_members
FOR SELECT
USING (true);


-- 5. CMS Content: Sub-Admins VIEW ONLY (Except Active Calls - different table)
DROP POLICY IF EXISTS "Admins can manage dashboard content" ON public.dashboard_content;
DROP POLICY IF EXISTS "Everyone view dashboard content" ON public.dashboard_content;

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

CREATE POLICY "Everyone view dashboard content"
ON public.dashboard_content
FOR SELECT
USING (true);


-- 6. Support Calls (Active Calls): Sub-Admins CAN MANAGE
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
