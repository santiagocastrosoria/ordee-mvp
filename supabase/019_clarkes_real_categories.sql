-- Clarke's: migrate from 4 MVP buckets to ~22 real menu categories.
-- Idempotent. Run after 018_restaurant_menu_saas.sql and 017_clarkes_bootstrap.sql.

with resto as (
  select id from public.restaurants where slug = 'clarkes' limit 1
)
insert into public.menu_categories (restaurant_id, code, name, sort_order)
select resto.id, t.code, t.name, t.sort_order
from resto
cross join (
  values
    ('cervezas'::text, 'Cervezas'::text, 10),
    ('chopp'::text, 'Chopp'::text, 20),
    ('hidromiel'::text, 'Hidromiel'::text, 30),
    ('vinos'::text, 'Vinos'::text, 40),
    ('sin_alcohol'::text, 'Bebidas sin alcohol'::text, 50),
    ('picadas'::text, 'Picadas'::text, 60),
    ('hamburguesas'::text, 'Hamburguesas'::text, 70),
    ('wraps'::text, 'Wraps'::text, 80),
    ('merienda_irlandesa'::text, 'Merienda irlandesa'::text, 90),
    ('sandwiches'::text, 'Sandwiches calientes'::text, 100),
    ('cazuelas'::text, 'Cazuelas'::text, 110),
    ('papas_fritas'::text, 'Papas fritas'::text, 120),
    ('cocktails_ron'::text, 'Cocktails - Ron'::text, 130),
    ('cocktails_gin'::text, 'Cocktails - Gin'::text, 140),
    ('cocktails_vodka'::text, 'Cocktails - Vodka'::text, 150),
    ('cocktails_tequila'::text, 'Cocktails - Tequila'::text, 160),
    ('irish_drinks'::text, 'Irish drinks'::text, 170),
    ('whiskey'::text, 'Whiskey'::text, 180),
    ('vermouth'::text, 'Vermouth'::text, 190),
    ('tragos_helado'::text, 'Tragos con helado'::text, 200),
    ('otros'::text, 'Otros'::text, 210),
    ('shots'::text, 'Shots'::text, 220)
) as t(code, name, sort_order)
on conflict (restaurant_id, code) do update
  set name = excluded.name, sort_order = excluded.sort_order;

-- Reassign items by product name
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cervezas'
  and mi.restaurant_id = r.id and mi.name = 'Heineken 1 lt';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Golden Ale - Walmunz';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Cream Stout - Walmunz';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Scotch Ale - Walmunz';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Barley Wine - Walmunz';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Smoked - Clarke''s';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Irish Red - Bufon';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'A.P.A - Fermentum';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'American I.P.A - Fermentum';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Juicy I.P.A - Fermentum';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'chopp'
  and mi.restaurant_id = r.id and mi.name = 'Hoppy Lager - Fermentum';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hidromiel'
  and mi.restaurant_id = r.id and mi.name = 'Shot de hidromiel';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vinos'
  and mi.restaurant_id = r.id and mi.name = 'Callia';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vinos'
  and mi.restaurant_id = r.id and mi.name = 'Latitud 33';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vinos'
  and mi.restaurant_id = r.id and mi.name = 'Portillo';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vinos'
  and mi.restaurant_id = r.id and mi.name = 'Copa - Partridge';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sin_alcohol'
  and mi.restaurant_id = r.id and mi.name = 'Agua mineral c/s gas';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sin_alcohol'
  and mi.restaurant_id = r.id and mi.name = 'Gaseosas';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sin_alcohol'
  and mi.restaurant_id = r.id and mi.name = 'Limonada';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sin_alcohol'
  and mi.restaurant_id = r.id and mi.name = 'Energizante';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'picadas'
  and mi.restaurant_id = r.id and mi.name = 'Tabla de fiambres';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'picadas'
  and mi.restaurant_id = r.id and mi.name = 'Tabla Clarke''s';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'picadas'
  and mi.restaurant_id = r.id and mi.name = 'Tabla vegetariana';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'picadas'
  and mi.restaurant_id = r.id and mi.name = 'Tabla vegana';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'picadas'
  and mi.restaurant_id = r.id and mi.name = 'Tabla irlandesa';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hamburguesas'
  and mi.restaurant_id = r.id and mi.name = 'Simple';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hamburguesas'
  and mi.restaurant_id = r.id and mi.name = 'Completa';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hamburguesas'
  and mi.restaurant_id = r.id and mi.name = 'Con hongos';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hamburguesas'
  and mi.restaurant_id = r.id and mi.name = 'Azul';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hamburguesas'
  and mi.restaurant_id = r.id and mi.name = 'Provoleta criolla';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'hamburguesas'
  and mi.restaurant_id = r.id and mi.name = 'Vegana';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'wraps'
  and mi.restaurant_id = r.id and mi.name = 'Wrap de falafel - Vegano';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'wraps'
  and mi.restaurant_id = r.id and mi.name = 'Wrap de pollo';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'merienda_irlandesa'
  and mi.restaurant_id = r.id and mi.name = 'Merienda irlandesa';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sandwiches'
  and mi.restaurant_id = r.id and mi.name = 'Tostado';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sandwiches'
  and mi.restaurant_id = r.id and mi.name = 'Tostado Clarke''s';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sandwiches'
  and mi.restaurant_id = r.id and mi.name = 'Club Sandwich';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sandwiches'
  and mi.restaurant_id = r.id and mi.name = 'Lorraine Sandwich';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sandwiches'
  and mi.restaurant_id = r.id and mi.name = 'Vegetariano';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'sandwiches'
  and mi.restaurant_id = r.id and mi.name = 'Irlandés';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Papas fritas';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Aros de cebolla';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Bastones de queso frito';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Hummus + cazuela de pan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Escabeche de verduras + pan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Provoletitas';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Salsa de queso + pan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Dados de queso saborizados';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Roquefort + pan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Pakoras';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cazuelas'
  and mi.restaurant_id = r.id and mi.name = 'Falafel con mayo de aquafaba';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Papas fritas con cazuela de mayo';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Papas con queso';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Papas cajun';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Papas con huevo';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Papas Clarke''s';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Papas irlandesas';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'papas_fritas'
  and mi.restaurant_id = r.id and mi.name = 'Adicional panceta';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Cuba Libre';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Mojito';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Apple Mojito';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Ginger Mojito';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Daiquiri';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Ames';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_ron'
  and mi.restaurant_id = r.id and mi.name = 'Stacey Malibú';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_gin'
  and mi.restaurant_id = r.id and mi.name = 'Martini';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_gin'
  and mi.restaurant_id = r.id and mi.name = 'Sweet Martini';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_gin'
  and mi.restaurant_id = r.id and mi.name = 'Gin Tonic';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_gin'
  and mi.restaurant_id = r.id and mi.name = 'Gin Tonic Premium';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_gin'
  and mi.restaurant_id = r.id and mi.name = 'Tom Collins';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_gin'
  and mi.restaurant_id = r.id and mi.name = 'Negroni';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'Destornillador (Screwdriver)';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'Apple Martini';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'Cosmopolitan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'Swing';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'Sex on the Beach';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'Caipivodka';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_vodka'
  and mi.restaurant_id = r.id and mi.name = 'White Russian';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_tequila'
  and mi.restaurant_id = r.id and mi.name = 'Tequila Shot';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_tequila'
  and mi.restaurant_id = r.id and mi.name = 'Margarita clásico';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_tequila'
  and mi.restaurant_id = r.id and mi.name = 'Margarita frozen';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_tequila'
  and mi.restaurant_id = r.id and mi.name = 'Tequila Sunrise';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'cocktails_tequila'
  and mi.restaurant_id = r.id and mi.name = 'Chapala';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'irish_drinks'
  and mi.restaurant_id = r.id and mi.name = 'Irish Car Bomb';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'irish_drinks'
  and mi.restaurant_id = r.id and mi.name = 'Arthur Guinness';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'irish_drinks'
  and mi.restaurant_id = r.id and mi.name = 'Irish Martini';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'irish_drinks'
  and mi.restaurant_id = r.id and mi.name = 'Irish Manhattan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Manhattan';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Old Fashioned';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Mint Julep';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Boulevardier';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Mr. Jameson';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Estrella';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'whiskey'
  and mi.restaurant_id = r.id and mi.name = 'Penicilin';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vermouth'
  and mi.restaurant_id = r.id and mi.name = 'Vermouth';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vermouth'
  and mi.restaurant_id = r.id and mi.name = 'Ferroviario';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vermouth'
  and mi.restaurant_id = r.id and mi.name = 'Americano';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vermouth'
  and mi.restaurant_id = r.id and mi.name = 'Cynar Julep';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'vermouth'
  and mi.restaurant_id = r.id and mi.name = 'Cynar';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'tragos_helado'
  and mi.restaurant_id = r.id and mi.name = 'Azalea';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'tragos_helado'
  and mi.restaurant_id = r.id and mi.name = 'Sin-door';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'tragos_helado'
  and mi.restaurant_id = r.id and mi.name = 'Irish Cream';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Fernet con Coca-Cola';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Fernet medida';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Jagger Bomb';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Jagger Julep';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Garibaldi';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Caipirinha';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Baileys';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'otros'
  and mi.restaurant_id = r.id and mi.name = 'Caipicoco';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Tabla de 10 shots - hasta 2 variedades';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Tabla de 10 shots - más de 2 variedades';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Shot individual';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Brain Hemmorrhage';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Baby Guinnes';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Irish Flag';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'After 8';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Brain Damage';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Sweet Injury';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Bob Marley';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Vodka Canela';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'Kiwika';
update public.menu_items mi
set category_id = mc.id
from public.restaurants r, public.menu_categories mc
where r.slug = 'clarkes'
  and mc.restaurant_id = r.id and mc.code = 'shots'
  and mi.restaurant_id = r.id and mi.name = 'B-52';

-- Clear accidental demo image paths
update public.menu_items mi
set image_url = null
from public.restaurants r
where mi.restaurant_id = r.id and r.slug = 'clarkes';

-- Remove obsolete MVP category rows when empty
delete from public.menu_categories mc
using public.restaurants r
where mc.restaurant_id = r.id
  and r.slug = 'clarkes'
  and mc.code in ('entrada', 'principal', 'bebida', 'postre')
  and not exists (
    select 1 from public.menu_items mi where mi.category_id = mc.id
  );
