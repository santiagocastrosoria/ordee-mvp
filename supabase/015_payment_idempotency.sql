-- Prevent duplicate orders from concurrent MercadoPago webhooks.
--
-- PROBLEM: MP retries webhooks and two concurrent calls can both read
-- session.status = 'pending' before either commits the update,
-- resulting in two orders created for one payment.
--
-- FIX: Partial UNIQUE INDEX on payments.provider_payment_id.
-- Allows many rows with NULL (cash/manual payments) but enforces
-- uniqueness for any non-null MP payment ID.
-- Any second insert with the same payment ID gets a 23505 error —
-- the application catches this, cleans up the orphan order, and
-- returns the already-created order.
--
-- HOW TO RUN:
--   Paste in Supabase Dashboard → SQL Editor → Run.

create unique index if not exists payments_provider_payment_id_unique
  on payments (provider_payment_id)
  where provider_payment_id is not null;

-- Also add a unique partial index on mp_checkout_sessions.order_id
-- so a single session can never point to two different orders.
create unique index if not exists mp_checkout_sessions_order_id_unique
  on mp_checkout_sessions (order_id)
  where order_id is not null;
