-- Add message_id to media_uploads to link media to specific messages
ALTER TABLE public.media_uploads
ADD COLUMN message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE;

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'thumbs_up')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions in their groups
CREATE POLICY "Users can view reactions in their groups"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = message_reactions.message_id
    AND gm.user_id = auth.uid()
  )
);

-- Users can add reactions to messages in their groups
CREATE POLICY "Users can add reactions to messages in their groups"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = message_reactions.message_id
    AND gm.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;