revoke all privileges on table public.app_state from public, anon, authenticated;
grant select on table public.app_state to anon, authenticated;
grant insert, update on table public.app_state to authenticated;

revoke all privileges on table public.app_admins from public, anon, authenticated;
grant select on table public.app_admins to authenticated;

drop policy if exists "Anyone can read the public app state" on public.app_state;
create policy "Anyone can read the public app state"
  on public.app_state
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Only an allowlisted admin can initialize app state" on public.app_state;
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

drop policy if exists "Only an allowlisted admin can update app state" on public.app_state;
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

drop policy if exists "Admins can read their own membership" on public.app_admins;
create policy "Admins can read their own membership"
  on public.app_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
