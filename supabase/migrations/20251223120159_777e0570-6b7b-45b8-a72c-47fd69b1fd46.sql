-- Update RLS policies for groups table to allow admin and sub_admin
DROP POLICY IF EXISTS "Only admins can create groups" ON public.groups;
DROP POLICY IF EXISTS "Only admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Only admins can delete groups" ON public.groups;

CREATE POLICY "Admins and sub_admins can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sub_admin'::app_role)
);

CREATE POLICY "Admins and sub_admins can update groups" 
ON public.groups 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sub_admin'::app_role)
);

CREATE POLICY "Admins and sub_admins can delete groups" 
ON public.groups 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sub_admin'::app_role)
);

-- Update RLS policies for group_members to allow admin and sub_admin
DROP POLICY IF EXISTS "Only admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Only admins can remove members" ON public.group_members;

CREATE POLICY "Admins and sub_admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sub_admin'::app_role)
);

CREATE POLICY "Admins and sub_admins can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'sub_admin'::app_role)
);

-- Helper function to check if user is admin or sub_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_subadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'sub_admin')
  )
$$;