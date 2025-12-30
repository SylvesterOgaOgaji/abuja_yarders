
-- Fix the get_group_name_for_town function to have proper search_path
CREATE OR REPLACE FUNCTION public.get_group_name_for_town(town_name text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE town_name
    -- Handle special cases where group name differs from town name
    WHEN 'Gwagwalada Town' THEN 'Gwagwalada Town Yarders'
    WHEN 'Kuje Town' THEN 'Kuje Town Yarders'
    WHEN 'Bwari Town' THEN 'Bwari Town Yarders'
    WHEN 'Abaji Town' THEN 'Abaji Town Yarders'
    WHEN 'Kwali Town' THEN 'Kwali Town Yarders'
    ELSE town_name || ' Yarders'
  END
$$;
