-- Add winner_id, payment_deadline, and verification fields to bids table
ALTER TABLE public.bids
ADD COLUMN winner_id UUID REFERENCES auth.users(id),
ADD COLUMN payment_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
ADD COLUMN verification_url TEXT;

-- Create notifications table for bid winners
CREATE TABLE public.bid_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bid_notifications
ALTER TABLE public.bid_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.bid_notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can mark their notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.bid_notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Enable realtime for bid_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.bid_notifications;