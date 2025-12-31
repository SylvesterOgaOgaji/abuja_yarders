-- Create support_calls table
CREATE TABLE IF NOT EXISTS public.support_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    category TEXT CHECK (category IN ('financial', 'medical', 'volunteering', 'other')) DEFAULT 'other',
    is_active BOOLEAN DEFAULT true,
    target_amount NUMERIC,
    raised_amount NUMERIC DEFAULT 0,
    contact_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.support_calls ENABLE ROW LEVEL SECURITY;

-- Policies

-- Everyone can view ACTIVE calls (or maybe all authenticated users?)
-- Let's allow authenticated users to view active calls.
CREATE POLICY "Authenticated users can view active calls"
ON public.support_calls
FOR SELECT
TO authenticated
USING (is_active = true OR 
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'sub_admin')
    )
);

-- Admins can do everything
CREATE POLICY "Admins can manage support calls"
ON public.support_calls
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'sub_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'sub_admin')
    )
);
