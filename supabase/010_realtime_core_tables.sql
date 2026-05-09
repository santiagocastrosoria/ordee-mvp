-- Hardening MVP core tables for realtime sync across ORDEE-MVP and ORDEE-COCINA
-- Safe to run multiple times.

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price_ars int not null check (price_ars > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table menu_items add column if not exists image_url text;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_name text not null,
  table_number text,
  notes text,
  status text not null default 'nuevo' check (status in ('nuevo', 'preparando', 'listo', 'entregado', 'cancelado')),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'pagado', 'fallido')),
  payment_method text not null default 'mercado_pago' check (payment_method in ('mercado_pago', 'transferencia', 'naranja_x', 'modo', 'otro', 'efectivo')),
  total_ars int not null check (total_ars >= 0),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id text,
  item_name text not null,
  quantity int not null check (quantity > 0),
  unit_price_ars int not null check (unit_price_ars > 0),
  subtotal_ars int generated always as (quantity * unit_price_ars) stored
);

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

create index if not exists idx_orders_restaurant_created on orders(restaurant_id, created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_menu_items_restaurant on menu_items(restaurant_id);
create index if not exists idx_help_requests_restaurant_status on help_requests(restaurant_id, status, created_at desc);
create index if not exists idx_restaurant_tables_restaurant on restaurant_tables(restaurant_id, table_number);

-- Required for update/delete realtime payloads with old/new row data
alter table orders replica identity full;
alter table order_items replica identity full;
alter table menu_items replica identity full;
alter table help_requests replica identity full;
alter table restaurant_tables replica identity full;
