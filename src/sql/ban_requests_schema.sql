-- Create the ban_requests table if it doesn't exist
create table if not exists public.ban_requests (
  id uuid default gen_random_uuid() primary key,
  target_user_id uuid references public.profiles(id) on delete cascade not null,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ban_requests enable row level security;

-- Policies
create policy "Admins can view all ban requests"
  on public.ban_requests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Sub-admins can create ban requests"
  on public.ban_requests for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'sub_admin' or profiles.role = 'admin')
    )
  );

create policy "Admins can update ban requests"
  on public.ban_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
