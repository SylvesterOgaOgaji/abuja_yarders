-- Add photo_url and vnin_share_code to seller_requests table
ALTER TABLE public.seller_requests 
ADD COLUMN photo_url TEXT,
ADD COLUMN vnin_share_code TEXT;

-- Create storage bucket for seller verification photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seller-verification',
  'seller-verification',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their verification photos
CREATE POLICY "Users can upload their verification photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seller-verification' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own verification photos
CREATE POLICY "Users can view their own verification photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-verification' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all verification photos
CREATE POLICY "Admins can view all verification photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seller-verification' AND
  public.has_role(auth.uid(), 'admin')
);