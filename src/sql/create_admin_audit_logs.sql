-- Create table for tracking admin actions on sensitive data
create table if not exists public.admin_audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    action text not null, -- e.g. 'PRINT_USER_REPORT', 'EXPORT_USER_CSV'
    details jsonb default '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.admin_audit_logs enable row level security;

-- Policy: Admins can view logs
create policy "Admins can view audit logs"
    on public.admin_audit_logs
    for select
    using (
        exists (
            select 1 from public.user_roles
            where user_roles.user_id = auth.uid()
            and user_roles.role in ('admin', 'sub_admin')
        )
    );

-- Policy: Admins can insert logs (server-side or trusted client in this context)
create policy "Admins can insert audit logs"
    on public.admin_audit_logs
    for insert
    with check (
        auth.uid() = user_id
    );
