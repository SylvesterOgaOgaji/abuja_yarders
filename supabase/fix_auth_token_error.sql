-- Fix for "Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported"
-- This error implies the Auth service expects a string value for confirmation_token, not NULL, likely due to a driver/version mismatch in the local environment.

UPDATE auth.users
SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  reauthentication_token = ''
WHERE email = 'slyokoh@gmail.com';
