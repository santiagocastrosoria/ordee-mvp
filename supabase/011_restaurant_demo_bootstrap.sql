-- Bootstrap idempotente para `public.restaurants` (equivalente al runtime `ensureRestaurantBySlug`).
-- Opcional: la app también crea esta fila si falta.

insert into public.restaurants (name, slug)
values ('ORDEE Demo', 'demo-ordee')
on conflict (slug) do update
set name = excluded.name;
