-- Create user_commitments table
CREATE TABLE IF NOT EXISTS public.user_commitments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount_pledged NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'fulfilled', 'cancelled')) DEFAULT 'active',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_commitments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can manage commitments"
ON public.user_commitments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- All authenticated users can view commitments (Frontend control will handle visibility, but RLS allows read)
CREATE POLICY "Authenticated users can view commitments"
ON public.user_commitments
FOR SELECT
TO authenticated
USING (true);

-- Add configuration for public visibility
INSERT INTO public.dashboard_content (key, value, description)
VALUES ('show_commitments_publicly', 'false', 'Toggle public visibility of the commitment list')
ON CONFLICT (key) DO NOTHING;
