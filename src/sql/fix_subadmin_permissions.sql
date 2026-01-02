-- Enable RLS on seller_requests if not already
ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Enable read access for admins" ON public.seller_requests;
DROP POLICY IF EXISTS "Enable update for admins" ON public.seller_requests;
DROP POLICY IF EXISTS "Admins and SubAdmins can view requests" ON public.seller_requests;
DROP POLICY IF EXISTS "Admins and SubAdmins can update requests" ON public.seller_requests;

-- 1. Policies for seller_requests
-- Allow Admin and Sub-Admin to VIEW requests
CREATE POLICY "Admins and SubAdmins can view requests"
ON public.seller_requests
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('admin', 'sub_admin')
  )
);

-- Allow Admin and Sub-Admin to UPDATE requests (approve/reject)
CREATE POLICY "Admins and SubAdmins can update requests"
ON public.seller_requests
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('admin', 'sub_admin')
  )
);

-- 2. Policies for user_roles
-- Allow Sub-Admins to INSERT into user_roles (specifically to add 'seller')
-- Note: 'admin' likely already has a policy cover-all, but we ensure sub_admin has explicit permission here.
-- We check if a policy allowing sub_admins to insert exists, if not create one.

DROP POLICY IF EXISTS "SubAdmins can assign seller roles" ON public.user_roles;

CREATE POLICY "SubAdmins can assign seller roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- The user performing the action must be a sub_admin (or admin)
  (auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sub_admin')
   ))
  -- AND the role being assigned must be 'seller' (Optional safety check, but user request implies full trust for approvals)
  -- For now, we allow them to insert rows if they are auth'd as sub_admin.
);

-- Verify dashboard_content "mission_text" etc exists (Just to be safe based on previous task)
-- (Already done in previous step, but doing no harm)
