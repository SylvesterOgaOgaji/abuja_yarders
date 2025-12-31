-- Add is_banned column to profiles if it doesn't exist
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "is_banned" boolean DEFAULT false;

-- Create policy to allow admins to update ban status
CREATE POLICY "Admins can update ban status"
ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_subadmin(auth.uid())
)
WITH CHECK (
  public.is_admin_or_subadmin(auth.uid())
);
