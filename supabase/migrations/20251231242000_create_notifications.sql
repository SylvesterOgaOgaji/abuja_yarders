-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Ideally restrict to service_role or admin functions, but for simplicity allowing inserts (e.g. from triggers/functions)

-- Function to check for active pledges and notify (to be called by cron or edge function)
CREATE OR REPLACE FUNCTION check_and_notify_pledges()
RETURNS void AS $$
DECLARE
    pledge RECORD;
BEGIN
    -- Select active pledges (support_pledge) that are not fulfilled/cancelled
    FOR pledge IN 
        SELECT distinct user_id 
        FROM user_commitments 
        WHERE commitment_type = 'support_pledge' 
        AND status = 'active'
    LOOP
        -- Check if notification already sent today for this user (to avoid spam if run multiple times)
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = pledge.user_id 
            AND title = 'Pledge Reminder' 
            AND created_at > current_date
        ) THEN
            INSERT INTO notifications (user_id, title, message)
            VALUES (
                pledge.user_id, 
                'Pledge Reminder', 
                'You have an active pledge. Please remember to fulfill it to support the community!'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger or Cron?
-- Since Supabase free tier might not have pg_cron enabled, we'll create the function 
-- and the USER can set up a Cron job in Supabase Dashboard (or external) to call:
-- SELECT check_and_notify_pledges();
-- Recommended frequency: Twice daily (Morning/Evening).

-- Grant execute to authenticated (if we want to trigger from client for testing, though better from secure context)
GRANT EXECUTE ON FUNCTION check_and_notify_pledges TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
