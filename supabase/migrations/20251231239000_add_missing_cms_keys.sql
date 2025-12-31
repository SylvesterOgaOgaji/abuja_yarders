-- Insert new dashboard content keys if they don't exist
INSERT INTO "public"."dashboard_content" (key, value, description)
VALUES 
('featured_event_link', '#', 'Link for the "Register Now" button on the Featured Event card'),
('special_notice_link', '#', 'Link for the "Read More" button on the Special Announcement card')
ON CONFLICT (key) DO NOTHING;
