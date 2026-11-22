create table if not exists public.app_state (
  id text primary key check (id = 'default'),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state
  add column if not exists id text,
  add column if not exists state jsonb,
  add column if not exists updated_at timestamptz;

alter table public.app_state
  alter column id type text using id::text,
  alter column state type jsonb using state::jsonb,
  alter column updated_at type timestamptz using updated_at::timestamptz,
  alter column updated_at set default now();

do $$
declare
  id_attribute smallint;
begin
  update public.app_state
  set updated_at = now()
  where updated_at is null;

  if exists (
    select 1
    from public.app_state
    where id is distinct from 'default' or state is null
  ) then
    raise exception 'public.app_state contains invalid or incomplete rows; retain/fix the existing data before applying this migration';
  end if;

  alter table public.app_state
    alter column id set not null,
    alter column state set not null,
    alter column updated_at set not null;

  select attnum
  into id_attribute
  from pg_attribute
  where attrelid = 'public.app_state'::regclass
    and attname = 'id'
    and not attisdropped;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_state'::regclass
      and contype = 'p'
      and conkey <> array[id_attribute]::smallint[]
  ) then
    raise exception 'public.app_state has a primary key other than id; repair the table schema before applying this migration';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_state'::regclass
      and contype = 'p'
  ) then
    alter table public.app_state add constraint app_state_pkey primary key (id);
  end if;

  alter table public.app_state
    drop constraint if exists app_state_id_default_check;
  alter table public.app_state
    add constraint app_state_id_default_check check (id = 'default');
end
$$;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.app_admins
  add column if not exists user_id uuid;

alter table public.app_admins
  alter column user_id type uuid using user_id::uuid;

do $$
declare
  user_id_attribute smallint;
begin
  if exists (select 1 from public.app_admins where user_id is null) then
    raise exception 'public.app_admins contains null memberships; repair the table before applying this migration';
  end if;

  alter table public.app_admins alter column user_id set not null;

  select attnum
  into user_id_attribute
  from pg_attribute
  where attrelid = 'public.app_admins'::regclass
    and attname = 'user_id'
    and not attisdropped;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_admins'::regclass
      and contype = 'p'
      and conkey <> array[user_id_attribute]::smallint[]
  ) then
    raise exception 'public.app_admins has a primary key other than user_id; repair the table schema before applying this migration';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_admins'::regclass
      and contype = 'p'
  ) then
    alter table public.app_admins add constraint app_admins_pkey primary key (user_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.app_admins'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
      and conkey = array[user_id_attribute]::smallint[]
  ) then
    alter table public.app_admins
      add constraint app_admins_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

alter table public.app_state enable row level security;
alter table public.app_admins enable row level security;

grant usage on schema public to anon, authenticated;

revoke all privileges on table public.app_state from public, anon, authenticated;
grant select on table public.app_state to anon, authenticated;
grant insert, update on table public.app_state to authenticated;

revoke all privileges on table public.app_admins from public, anon, authenticated;
grant select on table public.app_admins to authenticated;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('app_state', 'app_admins')
  loop
    execute format(
      'drop policy %I on public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  end loop;
end
$$;

create policy "Anyone can read the public app state"
  on public.app_state
  for select
  to anon, authenticated
  using (id = 'default');

create policy "Only the allowlisted admin can initialize app state"
  on public.app_state
  for insert
  to authenticated
  with check (
    id = 'default'
    and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );

create policy "Only the allowlisted admin can update app state"
  on public.app_state
  for update
  to authenticated
  using (
    id = 'default'
    and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  )
  with check (
    id = 'default'
    and lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );

create policy "Admins can read their own membership"
  on public.app_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
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
