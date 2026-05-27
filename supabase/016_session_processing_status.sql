-- Migration 016: add 'processing' to mp_checkout_sessions.status CHECK constraint
--
-- This enables an atomic "claim" pattern in the webhook handler:
--   UPDATE mp_checkout_sessions SET status = 'processing'
--   WHERE id = $ref AND status = 'pending'
--
-- Because PostgreSQL serialises concurrent UPDATEs on the same row,
-- exactly ONE webhook call wins the claim; all others see 0 rows
-- returned from .select().maybeSingle() and wait for the winner.
-- This prevents duplicate orders being created from concurrent webhook
-- calls (MP sends payment.created + payment.updated for the same payment).

-- 1. Drop the existing CHECK constraint (auto-named by Postgres)
alter table mp_checkout_sessions
  drop constraint if exists mp_checkout_sessions_status_check;

-- 2. Re-add with 'processing' included
alter table mp_checkout_sessions
  add constraint mp_checkout_sessions_status_check
  check (status in ('pending', 'processing', 'completed', 'failed'));
