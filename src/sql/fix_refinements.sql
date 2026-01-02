-- 1. Fix notify_chat_links trigger function (Replace sender_id with user_id)
CREATE OR REPLACE FUNCTION public.notify_chat_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
    v_sender_name TEXT;
    v_group_name TEXT;
BEGIN
    -- Only proceed if content contains http or https
    IF NEW.content ILIKE '%http%' THEN
        -- Get sender name (Changed sender_id to user_id)
        SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = NEW.user_id;
        IF v_sender_name IS NULL THEN v_sender_name := 'Someone'; END IF;

        -- Get group name
        SELECT name INTO v_group_name FROM public.groups WHERE id = NEW.group_id;

        -- Notify all other group members (Changed sender_id to user_id)
        FOR v_member_id IN
            SELECT user_id FROM public.group_members WHERE group_id = NEW.group_id AND user_id != NEW.user_id
        LOOP
            PERFORM public.create_notification(
                v_member_id,
                'Link shared in ' || COALESCE(v_group_name, 'Chat'),
                v_sender_name || ': shared a link. Click to view.',
                'chat_link',
                '/?group=' || NEW.group_id,
                NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Allow Sub-admins to approve seller requests
-- Drop existing policy if it conflicts or is too narrow, but usually better to ADD a new one or REPLACE.
-- Since we don't know the exact name of the existing policy restricting this, we'll try to add a permissive one for admins/sub-admins.
DROP POLICY IF EXISTS "Admins and Sub-admins can update seller requests" ON public.seller_requests;
CREATE POLICY "Admins and Sub-admins can update seller requests"
ON public.seller_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'sub_admin')
  )
);

-- 3. Allow Sub-admins to assign roles (INSERT permissions on user_roles)
DROP POLICY IF EXISTS "Admins and Sub-admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins and Sub-admins can manage user roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'sub_admin')
  )
);

-- 4. Fix Seller Verification Image Visibility
-- Ensure admins/sub-admins can view files in the 'seller-verification' bucket
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('seller-verification', 'seller-verification', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "Admins and Sub-admins can view seller verification" ON storage.objects;
CREATE POLICY "Admins and Sub-admins can view seller verification"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'seller-verification'
  AND (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'sub_admin')
    )
  )
);
