-- Compatibilidad semantica: vistas products y tables

create or replace view products as
select
  mi.id,
  mi.restaurant_id,
  mc.code as category,
  mi.name,
  mi.description,
  mi.price_ars,
  mi.image_url,
  mi.is_active,
  mi.created_at
from menu_items mi
join menu_categories mc on mc.id = mi.category_id;

create or replace view tables as
select
  rt.id,
  rt.restaurant_id,
  rt.table_number,
  rt.status,
  rt.qr_token,
  rt.created_at
from restaurant_tables rt;
