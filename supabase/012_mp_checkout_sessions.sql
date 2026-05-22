-- Sesiones de Checkout Pro: pedido se crea solo cuando el webhook confirma pago approved.
create table if not exists mp_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_name text not null,
  table_number text,
  notes text,
  items jsonb not null,
  total_ars int not null check (total_ars >= 0),
  payment_method text not null default 'mercado_pago',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  order_id uuid references orders(id) on delete set null,
  mp_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mp_checkout_sessions_status on mp_checkout_sessions(status, created_at desc);
alter table mp_checkout_sessions replica identity full;
