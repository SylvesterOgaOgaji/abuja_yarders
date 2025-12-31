-- Drop existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Users can send messages to their groups" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their groups" ON public.messages;

DROP POLICY IF EXISTS "Users can upload media to their groups" ON public.media_uploads;
DROP POLICY IF EXISTS "Users can view media in their groups" ON public.media_uploads;

-- Messages Policies
CREATE POLICY "Users can view messages in their groups"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their groups"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Media Uploads Policies
CREATE POLICY "Users can view media in their groups"
  ON public.media_uploads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = media_uploads.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert media uploads in their groups"
  ON public.media_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = media_uploads.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- RE-RUN Backfill: Ensure all users are in "Abuja Yarders" group
-- This is safe to run multiple times due to ON CONFLICT DO NOTHING
DO $$
DECLARE
  general_group_id uuid;
BEGIN
  -- Find the Abuja Yarders group
  SELECT id INTO general_group_id
  FROM public.groups
  WHERE name = 'Abuja Yarders';
  
  -- Insert all users if group exists
  IF general_group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id)
    SELECT general_group_id, p.id
    FROM public.profiles p
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
