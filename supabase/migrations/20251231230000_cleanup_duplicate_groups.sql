-- Remove groups that were part of the old manual creation (identified by 'Yarders' suffix or duplicates)
-- Based on user feedback: "Wuse" (New, Keep) vs "Wuse Yarders" (Old, Delete)

DELETE FROM public.groups
WHERE name LIKE '%Yarders' 
AND name != 'Abuja Yarders'; -- Keep the main "Abuja Yarders" group if it exists and is intended to stay as a general group

-- Ensure we don't accidentally delete the "Official Town Group" ones which we just seeded
-- The seeded ones are "Wuse", "Gwagwalada Town", "Sheda", etc. (Without "Yarders")
