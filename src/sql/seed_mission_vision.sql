-- Insert default values for Mission, Vision, and Core Goals if they don't exist
INSERT INTO public.dashboard_content (key, value, description)
VALUES 
    ('mission_text', 'To empower our community through unity and service.', 'Mission Statement'),
    ('vision_text', 'A thriving community where every member supports one another.', 'Vision Statement'),
    ('core_goals_text', '1. Unity\n2. Service\n3. Growth', 'Core Goals (List)')
ON CONFLICT (key) DO NOTHING;

-- Ensure birthday notification settings exist if we need them (optional, but good for CMS)
INSERT INTO public.dashboard_content (key, value, description)
VALUES
    ('birthday_banner_enabled', 'true', 'Enable Birthday Banner')
ON CONFLICT (key) DO NOTHING;
