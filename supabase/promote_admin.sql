-- Promote slyokoh@gmail.com to Admin
-- Updates the public.profiles table to set the role to 'admin'

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'slyokoh@gmail.com';

-- Verify the change
SELECT * FROM public.profiles WHERE email = 'slyokoh@gmail.com';
