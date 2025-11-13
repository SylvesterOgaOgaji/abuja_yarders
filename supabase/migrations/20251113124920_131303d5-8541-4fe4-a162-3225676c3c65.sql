-- Add admin message field to seller_requests for requesting additional info
ALTER TABLE public.seller_requests
ADD COLUMN admin_message text,
ADD COLUMN admin_message_sent_at timestamp with time zone;

-- Add new status for requests needing more info
COMMENT ON COLUMN public.seller_requests.status IS 'Status: pending, needs_more_info, approved, rejected';