-- Fix the function to handle town names that already have ' Yarders' suffix
CREATE OR REPLACE FUNCTION public.get_group_name_for_town(town_name text)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    -- If the name already ends with ' Yarders' (case insensitive), return it as is
    WHEN town_name ILIKE '% Yarders' THEN town_name
    
    -- Handle special cases where input might be just the town name but needs specific formatting
    WHEN town_name = 'Gwagwalada Town' THEN 'Gwagwalada Town Yarders'
    WHEN town_name = 'Kuje Town' THEN 'Kuje Town Yarders'
    WHEN town_name = 'Bwari Town' THEN 'Bwari Town Yarders'
    WHEN town_name = 'Abaji Town' THEN 'Abaji Town Yarders'
    WHEN town_name = 'Kwali Town' THEN 'Kwali Town Yarders'
    
    -- Default case: Append ' Yarders'
    ELSE town_name || ' Yarders'
  END
$$;

-- Ensure standard users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Ensure standard users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Ensure standard users can insert their own profile (usually handled by trigger, but for safety)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
