-- Extensiones para panel staff, pagos multimedio y soporte

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('nuevo', 'preparando', 'listo', 'entregado', 'cancelado'));

alter table orders drop constraint if exists orders_payment_method_check;
alter table orders add constraint orders_payment_method_check check (payment_method in ('mercado_pago', 'transferencia', 'naranja_x', 'modo', 'otro', 'efectivo'));

create table if not exists help_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number text,
  status text not null default 'nuevo' check (status in ('nuevo', 'resuelto')),
  created_at timestamptz not null default now()
);

create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number text not null,
  status text not null default 'libre' check (status in ('libre', 'ocupada', 'esperando_pedido', 'comiendo', 'cobrando', 'cerrada')),
  qr_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_help_requests_restaurant_status on help_requests(restaurant_id, status, created_at desc);
create index if not exists idx_restaurant_tables_restaurant on restaurant_tables(restaurant_id, table_number);

alter table help_requests enable row level security;
alter table restaurant_tables enable row level security;

drop policy if exists "staff read help requests" on help_requests;
create policy "staff read help requests"
on help_requests for select
using (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id());

drop policy if exists "anyone insert help requests" on help_requests;
create policy "anyone insert help requests"
on help_requests for insert
with check (true);

drop policy if exists "staff update help requests" on help_requests;
create policy "staff update help requests"
on help_requests for update
using (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id())
with check (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id());

drop policy if exists "staff manage tables" on restaurant_tables;
create policy "staff manage tables"
on restaurant_tables for all
using (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id())
with check (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id());
