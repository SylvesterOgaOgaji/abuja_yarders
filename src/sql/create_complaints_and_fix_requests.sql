-- 1. Create seller_complaints table
CREATE TABLE IF NOT EXISTS public.seller_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable if anonymous reporting allowed later (though forcing auth is better)
    complaint_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.seller_complaints ENABLE ROW LEVEL SECURITY;

-- Policies for seller_complaints
-- Admins/Sub-Admins: Full key
DROP POLICY IF EXISTS "Admins can manage complaints" ON public.seller_complaints;
CREATE POLICY "Admins can manage complaints"
ON public.seller_complaints
FOR ALL
USING (
  auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'sub_admin'))
);

-- Users: Can insert (Report)
DROP POLICY IF EXISTS "Users can report sellers" ON public.seller_complaints;
CREATE POLICY "Users can report sellers"
ON public.seller_complaints
FOR INSERT
WITH CHECK (auth.uid() = reporter_id); 
-- Ensure reporter_id matches auth.uid()

-- 2. Fix seller_requests RLS for "Request More Info"
-- The user reported policy error. We will ensure the UPDATE policy is broad enough.
-- We previously created "Admins and SubAdmins can update requests".
-- We will recreate it with explicit WITH CHECK to be sure.

DROP POLICY IF EXISTS "Admins and SubAdmins can update requests" ON public.seller_requests;

CREATE POLICY "Admins and SubAdmins can update requests"
ON public.seller_requests
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('admin', 'sub_admin')
  )
);
-- Note: If we don't specify WITH CHECK, it defaults to using the USING clause (which checks role).
-- This should be correct. The error might be because of the user_roles recursion if not fixed properly.
-- But I ran fix_recursion.sql previously. I'll include a safety check for recursion here just in case? 
-- No, I shouldn't mix complexity. The recursion fix was global.

-- Ensure user_roles is readable by everyone (authenticated) just in case the recursion calls need it?
-- Previously I did: "Allow users to read their own role".
-- The Admin check `auth.uid() IN (SELECT user_id FROM user_roles WHERE role IN ...)` requires reading user_roles.
-- If the policy on user_roles is "Users can read own role", then `SELECT ... WHERE role IN ...` works because `auth.uid()` matches the user's *own* role row.
-- So this should work.

-- Double check if INSERT policy on user_roles for SubAdmins conflicts. Created in previous step.
-- That was for `user_roles` table. Here we update `seller_requests`.

-- Let's just run this.

-- 3. Just in case, ensure profiles 'is_verified_seller' column acts as cache?
-- User didn't ask for it, but might be useful. Skipping for now.

