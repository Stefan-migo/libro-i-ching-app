alter table public.journal_entries
  drop constraint journal_entries_entry_check,
  add constraint journal_entries_entry_check check (
    jsonb_typeof(entry) = 'object'
    and entry ? 'method'
    and jsonb_typeof(entry -> 'method') = 'string'
    and entry ->> 'method' in ('coins', 'yarrow', 'external')
    and case
      when jsonb_typeof(entry -> 'values') = 'array' then
        jsonb_array_length(entry -> 'values') = 6
        and (entry -> 'values') <@ '[6,7,8,9]'::jsonb
      else false
    end
    and (not (entry ? 'followUps') or jsonb_typeof(entry -> 'followUps') = 'array')
  );
