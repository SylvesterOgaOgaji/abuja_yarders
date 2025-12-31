-- Create dashboard_content table for dynamic text/images
CREATE TABLE IF NOT EXISTS public.dashboard_content (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT, -- What this key controls (for admin reference)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Establish RLS for dashboard_content
ALTER TABLE public.dashboard_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to dashboard_content"
    ON public.dashboard_content FOR SELECT
    USING (true);

CREATE POLICY "Allow admin full access to dashboard_content"
    ON public.dashboard_content FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- Create exco_members table
CREATE TABLE IF NOT EXISTS public.exco_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    image_url TEXT,
    bio TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Establish RLS for exco_members
ALTER TABLE public.exco_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to exco_members"
    ON public.exco_members FOR SELECT
    USING (true);

CREATE POLICY "Allow admin full access to exco_members"
    ON public.exco_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Seed initial data
INSERT INTO public.dashboard_content (key, value, description) VALUES
('hero_title', 'Welcome to the Hub', 'The large welcoming title text'),
('hero_subtitle', 'Stay connected, informed, and involved.', 'Subtitle below the welcome text'),
('featured_title', '2026 Inner Circle', 'Title of the featured event card'),
('featured_desc', 'Join us for a transformative experience. Registration is now open!', 'Description of the featured event'),
('featured_badge', 'Featured Event', 'Badge text for featured event'),
('announcement_title', 'Special Notice', 'Title of the announcement card'),
('announcement_text', 'All Yarders are requested to update their profiles with the latest contact information before the end of the month.', 'Content of the announcement')
ON CONFLICT (key) DO NOTHING;

-- Seed dummy Exco members
INSERT INTO public.exco_members (name, role, image_url, bio, display_order) VALUES
('John Doe', 'President', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'Leading with vision and purpose.', 1),
('Jane Smith', 'Vice President', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', 'Dedicated to community growth.', 2),
('Mike Johnson', 'Secretary', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'Keeping us organized and on track.', 3)
ON CONFLICT DO NOTHING;
