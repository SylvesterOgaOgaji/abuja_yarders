-- Fix for "Scan error on column index 8, name "email_change": converting NULL to string is unsupported"
-- This error occurs when the auth service scans users (e.g. to check for duplicates during signup) and encounters a NULL value in a column it expects to be a string.

UPDATE auth.users
SET 
  email_change = '',
  phone_change = '' -- potentially another culprit, setting just in case
WHERE email_change IS NULL OR phone_change IS NULL;
