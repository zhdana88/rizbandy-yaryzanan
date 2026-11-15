create table if not exists public.app_state (
  id text primary key check (id = 'default'),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.app_admins enable row level security;

grant select on public.app_state to anon, authenticated;
grant insert, update on public.app_state to authenticated;
grant select on public.app_admins to authenticated;

create policy "Admins can read their own membership"
  on public.app_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Anyone can read the public app state"
  on public.app_state
  for select
  to anon, authenticated
  using (true);

create policy "Only an allowlisted admin can initialize app state"
  on public.app_state
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );

create policy "Only an allowlisted admin can update app state"
  on public.app_state
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
end
$$;
