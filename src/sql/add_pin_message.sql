
-- Add is_pinned column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Ensure only one pinned message per group (Optional, but good UX. Or allow multiple? Usually one sticky header)
-- Let's stick to simple boolean first. If we want only one, we can handle it in logic or partial unique index.
-- For now, let's just add the column.

-- Create a policy to allow admins and sub-admins to update update messages (for pinning)
-- Existing policies might only allow users to update their own messages.
-- We need a policy for admins/sub-admins to update ANY message in the group to set is_pinned = true.

CREATE POLICY "Admins and Sub-Admins can update messages"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'sub_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'sub_admin')
  )
);
