-- Append 'Yarders' to all group names that don't already have it
-- Example: "Abaji Town" -> "Abaji Town Yarders"
-- "Abuja Yarders" -> "Abuja Yarders" (No change)

UPDATE public.groups
SET name = trim(name) || ' Yarders'
WHERE name NOT ILIKE '%Yarders';
