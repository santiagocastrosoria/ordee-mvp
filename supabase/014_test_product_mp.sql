-- Temporary test product for MercadoPago real payment testing.
-- Price: $10 ARS — low enough to avoid real charges during testing.
--
-- HOW TO RUN:
--   Paste this SQL in the Supabase Dashboard → SQL Editor → Run.
--
-- HOW TO REMOVE LATER:
--   Run the DELETE block at the bottom of this file in the SQL Editor.

insert into menu_items (restaurant_id, category_id, name, description, price_ars, is_active)
select
  r.id,
  c.id,
  'Prueba MP Real',
  'Test de pago — borrar después',
  10,
  true
from
  (select id from restaurants where slug = 'demo-ordee' limit 1) r
  join menu_categories c on c.restaurant_id = r.id and c.code = 'postre'
where not exists (
  select 1
  from menu_items mi
  where mi.restaurant_id = r.id
    and mi.name = 'Prueba MP Real'
);

-- ── TO REMOVE THIS PRODUCT LATER ──────────────────────────────────────────
-- Run this block in the Supabase SQL Editor when you no longer need it:
--
-- delete from menu_items
-- where name = 'Prueba MP Real'
--   and restaurant_id = (select id from restaurants where slug = 'demo-ordee' limit 1);
