-- Add announcement_image key
INSERT INTO public.dashboard_content (key, value, description) VALUES
('announcement_image', NULL, 'Image URL for the announcement card')
ON CONFLICT (key) DO NOTHING;
