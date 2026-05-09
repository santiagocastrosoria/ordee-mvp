-- Esquema inicial multi-restaurante (base para Supabase/Postgres)

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  code text not null check (code in ('entrada', 'principal', 'bebida', 'postre')),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

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

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  customer_name text not null,
  table_number text,
  notes text,
  status text not null check (status in ('nuevo', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  payment_status text not null check (payment_status in ('pendiente', 'pagado', 'fallido')),
  payment_method text not null check (payment_method in ('mercado_pago', 'transferencia', 'efectivo')),
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

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  status text not null,
  amount_ars int not null check (amount_ars >= 0),
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_menu_items_restaurant on menu_items(restaurant_id);
create index if not exists idx_orders_restaurant_created on orders(restaurant_id, created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);
