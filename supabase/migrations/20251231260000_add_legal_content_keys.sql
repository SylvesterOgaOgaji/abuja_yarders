-- Add legal content keys to dashboard_content
INSERT INTO public.dashboard_content (key, value, description)
VALUES 
    ('legal_terms', 'Enter Terms and Conditions here...', 'Full text for Terms and Conditions page'),
    ('legal_privacy', 'Enter Privacy Policy here...', 'Full text for Privacy Policy page'),
    ('legal_contact', 'Enter Contact Information here...', 'Contact details displayed on Contact Us page')
ON CONFLICT (key) DO NOTHING;
