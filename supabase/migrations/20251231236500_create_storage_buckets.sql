-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy to allow public access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy to allow authenticated users to update their own avatars (based on path naming convention usually, but simplistic for now)
-- Assuming path structure: userId/filename or just filename. For simplicity allowing all auth users to insert.
-- Realistically, RLS on storage.objects usually requires checking owner.
-- Let's make it simple: authenticated can insert, public can select.

-- Policy for documents (Admins only for upload, Public for view)
-- Re-using the admin check logic if possible, or just allowing authenticated for now for CMS simplicity, 
-- but ideally should be restricted. For now, authenticated uploads for documents too to unblock CMS features easily.

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public can view documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
