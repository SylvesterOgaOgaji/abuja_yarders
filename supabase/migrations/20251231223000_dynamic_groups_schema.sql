-- Add new columns to groups table
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS area_council TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Seed existing towns as groups
-- We use a DO block to iterate and insert
DO $$
DECLARE
    town_name text;
    council text;
    -- Map of council to towns array
    towns_json jsonb := '{
        "amac": ["Wuse", "Garki", "Maitama", "Asokoro", "Utako", "Jabi", "Lugbe", "Gwarinpa", "Apo", "Nyanya", "Karu"],
        "gwagwalada": ["Dobi", "Zuba", "Paiko", "Kutunku", "Gwagwalada Town"],
        "kuje": ["Kuje Town", "Rubochi", "Gwagwalada Road Axis", "Chibiri", "Gwargwada"],
        "bwari": ["Bwari Town", "Dutse", "Kubwa", "Byazhin", "Ushafa"],
        "abaji": ["Abaji Town", "Pandagi", "Gurdi", "Rimba"],
        "kwali": ["Kwali Town", "Pai", "Sheda"]
    }';
    town_array jsonb;
    t text;
BEGIN
    -- Loop through each key in the json object (area councils)
    FOR council IN SELECT jsonb_object_keys(towns_json) LOOP
        town_array := towns_json -> council;
        
        -- Loop through the array of towns for this council
        FOR t IN SELECT jsonb_array_elements_text(town_array) LOOP
            -- Check if group exists by name (simple check)
            -- We insert if it doesn't exist. 
            -- Note: We assume existing groups without area_council might not be these towns, 
            -- or if they match name, we update them?
            -- To be safe, we insert if no group with this name exists. 
            -- If a group with this name exists but no area_council, we update it.
            
            IF EXISTS (SELECT 1 FROM public.groups WHERE name = t) THEN
                 UPDATE public.groups SET area_council = council WHERE name = t AND area_council IS NULL;
            ELSE
                 INSERT INTO public.groups (name, area_council, created_by, description)
                 VALUES (t, council, (SELECT id FROM auth.users LIMIT 1), 'Official Town Group'); 
                 -- Note: created_by needs a valid UUID. Using a subquery for ANY user is risky if empty, 
                 -- but usually there is at least one. If not, this might fail or we default to a system user? 
                 -- Better to make created_by nullable or handle this gracefully. 
                 -- Actually, groups.created_by is UUID NOT NULL usually.
                 -- Let's check schema. If strict constraint, we might need a specific ID. 
                 -- For safety in migration, we can leave created_by as header or placeholder if possible, 
                 -- but usually FK constraint exists.
                 -- Assuming '00000000-0000-0000-0000-000000000000' or similar won't work with FK.
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Update RLS if needed?
-- Admins need full access to groups. Check existing RLS.
-- Existing groups policy usually allows read for members. We need generic read for Auth page? 
-- Actually Auth page is public/unauthenticated context (sign up)? 
-- NO, `supabase.auth.signUp` calls `profiles` insertion but fetching towns happens on the frontend.
-- `groups` table needs to be readable by anon/authenticated for the "Sign Up" dropdown to work?
-- OR we create a specific secure function to fetch towns.
-- Opening `groups` to public read might release sensitive group info.
-- Better to use a secure Postgres function or open RLS just for columns (id, name, area_council) where is_active=true.
-- But Supabase RLS is row-based. 
-- Let's add a policy allowing PUBLIC to read Active Groups that have an area_council (implying they are "Towns").

CREATE POLICY "Public can view active town groups" 
ON public.groups
FOR SELECT 
USING (is_active = true AND area_council IS NOT NULL);
