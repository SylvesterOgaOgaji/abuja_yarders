-- Insert featured_image_url key if it doesn't exist
INSERT INTO "public"."dashboard_content" (key, value, description)
VALUES 
('featured_image_url', '', 'Background image URL for the Featured Event card (optional)')
ON CONFLICT (key) DO NOTHING;
