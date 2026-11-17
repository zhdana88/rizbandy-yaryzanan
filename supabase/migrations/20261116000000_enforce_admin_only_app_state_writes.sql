revoke all privileges on table public.app_state from public, anon, authenticated;
grant select on table public.app_state to anon, authenticated;
grant insert, update, delete on table public.app_state to authenticated;

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

create policy "Only an allowlisted admin can delete app state"
  on public.app_state
  for delete
  to authenticated
  using (
    exists (
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
