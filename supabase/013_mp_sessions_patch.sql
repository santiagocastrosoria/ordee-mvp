-- Patch for mp_checkout_sessions table.
-- "create table if not exists" silently skips if the table already existed,
-- so mp_payment_id might be missing in databases created before this column was added.
-- Run this file once; it is idempotent (safe to run multiple times).

-- 1. Add mp_payment_id column if it doesn't exist
alter table mp_checkout_sessions
  add column if not exists mp_payment_id text;

-- 2. Enable realtime notifications for this table so the frontend can subscribe
--    to instant session status changes (pending → completed) without only relying on polling.
--    Note: replica identity full must also be set (already in 012_mp_checkout_sessions.sql).
alter table mp_checkout_sessions replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mp_checkout_sessions'
  ) then
    execute 'alter publication supabase_realtime add table mp_checkout_sessions';
    raise notice 'mp_checkout_sessions added to supabase_realtime publication';
  else
    raise notice 'mp_checkout_sessions already in supabase_realtime publication';
  end if;
end $$;
