-- Add new dashboard content keys for feedback items
INSERT INTO "public"."dashboard_content" (key, value, description)
VALUES 
('announcement_image_url', '', 'Image URL for the Special Announcement card (optional)'),
('policy_title', '2026 Policy Document', 'Title for the Policy Document card (e.g., 2027 Policy Document)')
ON CONFLICT (key) DO NOTHING;
