-- Add is_banned column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Update Messages DELETE Policy (User own + Admin)
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages; -- In case it existed (default didn't have one)
CREATE POLICY "Users and Admins can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update Messages INSERT Policy (Block Banned Users)
DROP POLICY IF EXISTS "Users can send messages to their groups" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their groups" ON public.messages;

CREATE POLICY "Users can insert messages in their groups"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_banned = true
    )
  );

-- Update Media INSERT Policy (Block Banned Users)
DROP POLICY IF EXISTS "Users can upload media to their groups" ON public.media_uploads;
DROP POLICY IF EXISTS "Users can insert media uploads in their groups" ON public.media_uploads;

CREATE POLICY "Users can insert media uploads in their groups"
  ON public.media_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = media_uploads.group_id
      AND group_members.user_id = auth.uid()
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_banned = true
    )
  );

-- Policy to allow Admins to UPDATE profiles (to Ban/Unban)
-- Currently only "Users can update own profile" exists.
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
