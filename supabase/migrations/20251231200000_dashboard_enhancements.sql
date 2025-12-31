-- Add date_of_birth to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Insert new dashboard content keys
INSERT INTO public.dashboard_content (key, value, description) VALUES
('featured_event_link', '/register', 'URL for the Featured Event button'),
('special_notice_link', '#', 'URL for Special Notice Read More button'),
('vision_text', 'To be the leading community hub.', 'Organization Vision Statement'),
('mission_text', 'Connecting people and empowering growth.', 'Organization Mission Statement'),
('goals_text', '1. Foster Unity\n2. Promote Commerce', 'Organization Goals'),
('policy_document_url', '', 'URL to the uploaded Policy Document (PDF)'),
('pledge_reason_text', 'Your support helps us maintain this platform and organize community events.', 'Explanation for why members should pledge');
