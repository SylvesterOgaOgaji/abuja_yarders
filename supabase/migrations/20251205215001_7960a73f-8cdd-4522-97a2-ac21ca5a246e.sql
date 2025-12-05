-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all requests" ON public.seller_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.seller_requests;

-- Create permissive policies instead
CREATE POLICY "Admins can view all requests"
ON public.seller_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own requests"
ON public.seller_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());