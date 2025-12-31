-- Insert policy_document_url key if it doesn't exist
INSERT INTO "public"."dashboard_content" (key, value, description)
VALUES 
('policy_document_url', '', 'URL to the uploaded Policy Document (PDF)')
ON CONFLICT (key) DO NOTHING;
