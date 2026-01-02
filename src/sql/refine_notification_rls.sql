-- REFINE NOTIFICATION PRIVACY
-- Ensure users only see their own notifications.

-- 1. Drop existing Notification policies (to be safe)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;

-- 2. Create STRICT read policy
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (
    user_id = auth.uid()
);

-- 3. Allow system (triggers) and admins to insert
-- (Triggers run as the user, or superuser depending on definition, but usually bypass RLS if defined securely)
-- Let's check INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users/System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true); 
-- We allow insertion by anyone (needed for triggers/functions running as user), 
-- but visibility is strictly limited by the SELECT policy above.

-- 4. ENABLE RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
