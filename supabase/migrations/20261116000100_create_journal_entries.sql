begin;

create table public.journal_entries (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  created_at timestamptz not null default now(),
  revision integer not null default 0 check (revision >= 0),
  entry jsonb not null check (
    jsonb_typeof(entry) = 'object'
    and entry ? 'method'
    and jsonb_typeof(entry -> 'method') = 'string'
    and entry ->> 'method' in ('coins', 'yarrow')
    and case
      when jsonb_typeof(entry -> 'values') = 'array' then
        jsonb_array_length(entry -> 'values') = 6
        and (entry -> 'values') <@ '[6,7,8,9]'::jsonb
      else false
    end
    and (not (entry ? 'followUps') or jsonb_typeof(entry -> 'followUps') = 'array')
  ),
  primary key (user_id, id)
);

create index journal_entries_by_date
  on public.journal_entries (user_id, created_at desc, id);

alter table public.journal_entries enable row level security;
revoke all on table public.journal_entries from public, anon, authenticated;
grant select, insert, delete on table public.journal_entries to authenticated;
grant update (entry, revision) on table public.journal_entries to authenticated;

create policy "Read own journal entries" on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own journal entries" on public.journal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own journal entries" on public.journal_entries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own journal entries" on public.journal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
