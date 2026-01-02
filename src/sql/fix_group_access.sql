-- FIX GROUP ACCESS & VISIBILITY

-- 1. Groups: Allow everyone to VIEW groups (so they can be listed)
DROP POLICY IF EXISTS "Sub-admins/Users view groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.groups;

CREATE POLICY "Authenticated users can view groups"
ON public.groups
FOR SELECT
TO authenticated
USING (true);

-- 2. Group Members: Allow users to view memberships (to know what they have joined)
-- Previous policies might have been too restrictive or non-existent
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;

CREATE POLICY "Users can view group memberships"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);

-- 3. Profiles: Ensure profiles are visible to authenticated users 
-- (Needed to show member names in lists, chat, etc.)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 4. Enable RLS on tables if not already (Good practice)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
