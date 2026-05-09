-- Auth por rol + politicas RLS (cliente/cocina/dueno)

create type app_role as enum ('cliente', 'cocina', 'dueno');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete set null,
  role app_role not null default 'cliente',
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'cliente')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table restaurants enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table profiles enable row level security;

create or replace function public.current_role()
returns app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_restaurant_id()
returns uuid
language sql
stable
as $$
  select restaurant_id from public.profiles where id = auth.uid()
$$;

-- Lectura publica de menu
create policy "public can read categories"
on menu_categories for select
using (true);

create policy "public can read items"
on menu_items for select
using (is_active = true);

-- Pedidos: cliente inserta, cocina/dueno gestionan
create policy "anyone can insert orders"
on orders for insert
with check (true);

create policy "kitchen owner read orders"
on orders for select
using (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id());

create policy "kitchen owner update orders"
on orders for update
using (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id())
with check (current_role() in ('cocina', 'dueno') and restaurant_id = current_restaurant_id());

create policy "anyone can insert order_items"
on order_items for insert
with check (true);

create policy "kitchen owner read order_items"
on order_items for select
using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and o.restaurant_id = current_restaurant_id()
      and current_role() in ('cocina', 'dueno')
  )
);

create policy "anyone can insert payments"
on payments for insert
with check (true);

create policy "kitchen owner read payments"
on payments for select
using (
  exists (
    select 1 from orders o
    where o.id = payments.order_id
      and o.restaurant_id = current_restaurant_id()
      and current_role() in ('cocina', 'dueno')
  )
);

create policy "owner update payments"
on payments for update
using (current_role() = 'dueno')
with check (current_role() = 'dueno');

create policy "user can read own profile"
on profiles for select
using (id = auth.uid());

create policy "user can update own profile"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Seed demo restaurant (opcional)
insert into restaurants (name, slug)
values ('ORDEE Demo', 'demo-ordee')
on conflict (slug) do nothing;
