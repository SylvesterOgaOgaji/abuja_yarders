-- Add expires_at to profiles
alter table public.profiles add column if not exists account_expires_at timestamp with time zone default '2026-12-24 23:59:59+00';

-- Trigger or Function to expire users? 
-- For now, just a function to Reactivate (Extend Access)
create or replace function public.reactivate_account(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if executor is admin
  if exists (
    select 1 from user_roles 
    where user_id = auth.uid() 
    and role in ('admin', 'sub_admin')
  ) then
    update public.profiles
    set account_expires_at = (now() + interval '1 year'),
        is_banned = false
    where id = target_user_id;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;
