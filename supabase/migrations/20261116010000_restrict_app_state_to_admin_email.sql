revoke all privileges on table public.app_state from public, anon, authenticated;
grant select on table public.app_state to anon, authenticated;
grant insert, update, delete on table public.app_state to authenticated;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_state'
  loop
    execute format('drop policy %I on public.app_state', existing_policy.policyname);
  end loop;
end
$$;

create policy "Anyone can read the public app state"
  on public.app_state
  for select
  to anon, authenticated
  using (true);

create policy "Only the allowlisted admin email can initialize app state"
  on public.app_state
  for insert
  to authenticated
  with check (
    coalesce((select auth.jwt() ->> 'email'), '') = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );

create policy "Only the allowlisted admin email can update app state"
  on public.app_state
  for update
  to authenticated
  using (
    coalesce((select auth.jwt() ->> 'email'), '') = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  )
  with check (
    coalesce((select auth.jwt() ->> 'email'), '') = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );

create policy "Only the allowlisted admin email can delete app state"
  on public.app_state
  for delete
  to authenticated
  using (
    coalesce((select auth.jwt() ->> 'email'), '') = 'zhdana88@gmail.com'
    and exists (
      select 1
      from public.app_admins
      where user_id = (select auth.uid())
    )
  );
