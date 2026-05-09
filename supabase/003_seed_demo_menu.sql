-- Seed de menu demo para probar menu real desde Supabase

with resto as (
  select id from restaurants where slug = 'demo-ordee' limit 1
)
insert into menu_categories (restaurant_id, code, name, sort_order)
select resto.id, t.code, t.name, t.sort_order
from resto
cross join (
  values
    ('entrada'::text, 'Entradas'::text, 1),
    ('principal'::text, 'Principales'::text, 2),
    ('bebida'::text, 'Bebidas'::text, 3),
    ('postre'::text, 'Postres'::text, 4)
) as t(code, name, sort_order)
where not exists (
  select 1
  from menu_categories mc
  where mc.restaurant_id = resto.id
    and mc.code = t.code
);

insert into menu_items (restaurant_id, category_id, name, description, price_ars, is_active)
select
  r.id,
  c.id,
  m.name,
  m.description,
  m.price_ars,
  true
from (select id from restaurants where slug = 'demo-ordee' limit 1) r
join menu_categories c on c.restaurant_id = r.id
join (
  values
    ('entrada'::text, 'Provoleta'::text, 'Con oregano y tomates cherry'::text, 2800),
    ('entrada'::text, 'Empanadas x4'::text, 'Carne cortada a cuchillo'::text, 3200),
    ('entrada'::text, 'Tabla de fiambres'::text, 'Jamon, salame, queso port salut'::text, 4500),
    ('entrada'::text, 'Ensalada verde'::text, 'Rucula, parmesano, nueces'::text, 2200),
    ('entrada'::text, 'Chorizo a la pomarola'::text, 'Con salsa casera y pan tostado'::text, 3100),
    ('principal'::text, 'Bife de chorizo'::text, 'Con papas rusticas'::text, 8900),
    ('principal'::text, 'Milanesa napolitana'::text, 'Con pure o fritas'::text, 7600),
    ('principal'::text, 'Vacio al horno'::text, 'Con papas y cebolla'::text, 8400),
    ('principal'::text, 'Bondiola braseada'::text, 'Con pure de batata'::text, 7900),
    ('principal'::text, 'Pasta del dia'::text, 'Salsa fileto o crema'::text, 6200),
    ('bebida'::text, 'Limonada'::text, 'Menta y jengibre'::text, 2400),
    ('bebida'::text, 'Agua mineral'::text, 'Con o sin gas'::text, 1600),
    ('bebida'::text, 'Gaseosa lata'::text, 'Linea Coca Cola'::text, 2100),
    ('bebida'::text, 'Copa de vino'::text, 'Malbec de la casa'::text, 3200),
    ('bebida'::text, 'Cerveza tirada'::text, 'Pinta rubia o roja'::text, 3500),
    ('postre'::text, 'Flan casero'::text, 'Con dulce de leche'::text, 2900),
    ('postre'::text, 'Brownie'::text, 'Con helado'::text, 3400),
    ('postre'::text, 'Mousse de chocolate'::text, 'Con crocante de avellanas'::text, 3300),
    ('postre'::text, 'Tiramisu'::text, 'Receta italiana clasica'::text, 3800),
    ('postre'::text, 'Helado artesanal'::text, '2 bochas a eleccion'::text, 2900)
) as m(code, name, description, price_ars) on m.code = c.code
where not exists (
  select 1
  from menu_items mi
  where mi.restaurant_id = r.id
    and mi.name = m.name
);
