-- =============================================================================
-- Clarke's Irish Bar — carta REAL (fuente: Carta Clarke's_merged.pdf)
-- Slug: clarkes  →  URL: /r/clarkes
--
-- Categorías MVP (4 codes fijos):
--   entrada   ← Picadas, Cazuelas, Papas fritas
--   principal ← Hamburguesas, Wraps, Merienda irlandesa, Sandwiches calientes
--   bebida    ← Chopp, Cervezas, Hidromiel, Vinos, Sin alcohol, Cocktails, etc.
--   postre    ← (vacía — no hay postres en la carta)
--
-- Idempotente. No toca demo-ordee.
-- =============================================================================

-- ── 1. Restaurante ───────────────────────────────────────────────────────────
insert into public.restaurants (name, slug)
values ('Clarke''s Irish Bar', 'clarkes')
on conflict (slug) do update
set name = excluded.name;

-- ── 2. Categorías MVP (4 filas) ───────────────────────────────────────────────
with resto as (
  select id from public.restaurants where slug = 'clarkes' limit 1
)
insert into public.menu_categories (restaurant_id, code, name, sort_order)
select resto.id, t.code, t.name, t.sort_order
from resto
cross join (
  values
    ('entrada'::text,   'Entradas'::text,          1),
    ('principal'::text, 'Platos principales'::text, 2),
    ('bebida'::text,    'Bebidas'::text,           3),
    ('postre'::text,    'Postres'::text,           4)
) as t(code, name, sort_order)
where not exists (
  select 1 from public.menu_categories mc
  where mc.restaurant_id = resto.id and mc.code = t.code
);

-- ── 3. Productos reales (124 ítems del PDF) ───────────────────────────
insert into public.menu_items (restaurant_id, category_id, name, description, price_ars, is_active)
select r.id, c.id, m.name, m.description, m.price_ars, true
from (select id from public.restaurants where slug = 'clarkes' limit 1) r
join public.menu_categories c on c.restaurant_id = r.id
join (
  values
    ('bebida'::text, 'Heineken 1 lt'::text, '[Cervezas] Botella 1 litro.'::text, 12000),
    ('bebida'::text, 'Golden Ale - Walmunz'::text, '[Chopp] Rubia ligera 4.5% Vol. 10 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Cream Stout - Walmunz'::text, '[Chopp] Negra tostada 5.0% Vol. Nitrogenada. 10 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Scotch Ale - Walmunz'::text, '[Chopp] Roja malta 6.0% Vol. 8 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Barley Wine - Walmunz'::text, '[Chopp] Roja fuerte, dulce e intensa 9.5% Vol. 25 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Smoked - Clarke''s'::text, '[Chopp] Rubia ahumada 5.5% Vol. 20 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Irish Red - Bufon'::text, '[Chopp] Roja suave dulce 4.6% Vol. 16 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'A.P.A - Fermentum'::text, '[Chopp] Rubia amarga 6.0% Vol. 40 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'American I.P.A - Fermentum'::text, '[Chopp] Rubia amarga fuerte 6.5% Vol. 45 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Juicy I.P.A - Fermentum'::text, '[Chopp] Rubia turbia tropical, bajo amargor 6.0% Vol. 30 IBU. Pinta 560 ml.'::text, 7000),
    ('bebida'::text, 'Hoppy Lager - Fermentum'::text, '[Chopp] Rubia lupulada, suave y ligera 4.5% Vol. 25 IBU. Pinta 560 ml.'::text, 6000),
    ('bebida'::text, 'Shot de hidromiel'::text, '[Hidromiel] Shot.'::text, 4000),
    ('bebida'::text, 'Callia'::text, '[Vinos] Vino.'::text, 15000),
    ('bebida'::text, 'Latitud 33'::text, '[Vinos] Vino.'::text, 17000),
    ('bebida'::text, 'Portillo'::text, '[Vinos] Vino.'::text, 16000),
    ('bebida'::text, 'Copa - Partridge'::text, '[Vinos] Copa de vino.'::text, 6000),
    ('bebida'::text, 'Agua mineral c/s gas'::text, '[Bebidas sin alcohol] Agua mineral con o sin gas.'::text, 3000),
    ('bebida'::text, 'Gaseosas'::text, '[Bebidas sin alcohol] Bebida gaseosa.'::text, 4500),
    ('bebida'::text, 'Limonada'::text, '[Bebidas sin alcohol] Limonada.'::text, 5000),
    ('bebida'::text, 'Energizante'::text, '[Bebidas sin alcohol] Bebida energizante.'::text, 5500),
    ('entrada'::text, 'Tabla de fiambres'::text, '[Picadas] Tabla de fiambres, quesos, olivas, escabeche de verduras, hummus y pan caliente.'::text, 16000),
    ('entrada'::text, 'Tabla Clarke''s'::text, '[Picadas] Papas fritas, ravioli frito de cordero, bastones de queso frito y cazuela caliente. Acompañada con salsa BBQ y salsa picante.'::text, 15500),
    ('entrada'::text, 'Tabla vegetariana'::text, '[Picadas] Papas fritas, pasta rellena horneada con salsa de vino tinto, bastones de queso frito y pakoras. Acompañada con salsa BBQ y salsa picante.'::text, 15500),
    ('entrada'::text, 'Tabla vegana'::text, '[Picadas] Papas fritas, falafel, pate de puerro y zanahoria y pakoras. Acompañada con mayo vegana de aquafaba y salsa picante.'::text, 15500),
    ('entrada'::text, 'Tabla irlandesa'::text, '[Picadas] Papas fritas con huevo, beans, salchicha parrillera y pan de campo.'::text, 16000),
    ('principal'::text, 'Simple'::text, '[Hamburguesas] Hamburguesa casera con queso, salsa criolla y mayo.'::text, 13500),
    ('principal'::text, 'Completa'::text, '[Hamburguesas] Hamburguesa casera con queso, lechuga, tomate, cebolla, panceta, huevo y mayo.'::text, 15000),
    ('principal'::text, 'Con hongos'::text, '[Hamburguesas] Hamburguesa casera con queso, hongos, jamón crudo, cebolla confitada y mayo.'::text, 15500),
    ('principal'::text, 'Azul'::text, '[Hamburguesas] Hamburguesa casera con queso azul, hongos, cebolla confitada, hojas verdes y mayo.'::text, 16000),
    ('principal'::text, 'Provoleta criolla'::text, '[Hamburguesas] Hamburguesa casera con queso provoleta, salsa criolla y mayo casera.'::text, 15000),
    ('principal'::text, 'Vegana'::text, '[Hamburguesas] Medallón de legumbres, queso vegano, mix de hojas verdes, tomate y mayo vegana de aquafaba.'::text, 13500),
    ('principal'::text, 'Wrap de falafel - Vegano'::text, '[Wraps] Tortilla de trigo, falafel, confit de vegetales, champignones, pate de remolacha, mani y hojas verdes. Dip de zanahoria y puerro.'::text, 13000),
    ('principal'::text, 'Wrap de pollo'::text, '[Wraps] Tortilla de trigo, pollo al curry, confit de vegetales, coleslaw, queso, lactonesa y hojas verdes.'::text, 13500),
    ('principal'::text, 'Merienda irlandesa'::text, '[Merienda irlandesa] Huevos, tomates asados, beans, papas fritas, champignones, salchicha parrillera, morcilla, panceta y pan casero. También disponible para cena.'::text, 17000),
    ('principal'::text, 'Tostado'::text, '[Sandwiches calientes] Jamón, queso y mayo en pan casero tipo árabe.'::text, 10500),
    ('principal'::text, 'Tostado Clarke''s'::text, '[Sandwiches calientes] Jamón, queso, lechuga, tomate, huevo, cebolla y mayo en pan casero tipo árabe.'::text, 13000),
    ('principal'::text, 'Club Sandwich'::text, '[Sandwiches calientes] Pollo, pepinillo, panceta, huevo duro, lechuga, queso tybo y mayo en pan casero tipo árabe.'::text, 13000),
    ('principal'::text, 'Lorraine Sandwich'::text, '[Sandwiches calientes] Jamón cocido, panceta, hongos, cebollas caramelizadas y salsa de quesos en pan casero tipo árabe.'::text, 13500),
    ('principal'::text, 'Vegetariano'::text, '[Sandwiches calientes] Variedad de vegetales salteados con hongos, queso y mayo en pan casero tipo árabe.'::text, 12500),
    ('principal'::text, 'Irlandés'::text, '[Sandwiches calientes] Panceta, chorizo, tomates asados, huevo, champignones, porotos en salsa de tomate y mayo en pan casero tipo flauta.'::text, 14000),
    ('entrada'::text, 'Papas fritas'::text, '[Cazuelas] Cazuela de papas fritas.'::text, 4000),
    ('entrada'::text, 'Aros de cebolla'::text, '[Cazuelas] Cazuela de aros de cebolla.'::text, 4000),
    ('entrada'::text, 'Bastones de queso frito'::text, '[Cazuelas] Cazuela de bastones de queso frito.'::text, 5500),
    ('entrada'::text, 'Hummus + cazuela de pan'::text, '[Cazuelas] Hummus con cazuela de pan.'::text, 4000),
    ('entrada'::text, 'Escabeche de verduras + pan'::text, '[Cazuelas] Escabeche de verduras con pan.'::text, 4000),
    ('entrada'::text, 'Provoletitas'::text, '[Cazuelas] Cazuela de provoletitas.'::text, 5500),
    ('entrada'::text, 'Olivas Clarke''s'::text, '[Cazuelas] Olivas Clarke''s.'::text, 3700),
    ('entrada'::text, 'Salsa de queso + pan'::text, '[Cazuelas] Salsa de queso con pan.'::text, 3700),
    ('entrada'::text, 'Dados de queso saborizados'::text, '[Cazuelas] Dados de queso saborizados.'::text, 4400),
    ('entrada'::text, 'Roquefort + pan'::text, '[Cazuelas] Roquefort con pan.'::text, 4600),
    ('entrada'::text, 'Pakoras'::text, '[Cazuelas] Mix de vegetales fritos con harina de garbanzos.'::text, 4600),
    ('entrada'::text, 'Falafel con mayo de aquafaba'::text, '[Cazuelas] Falafel con mayo vegana de aquafaba.'::text, 4600),
    ('entrada'::text, 'Papas fritas con cazuela de mayo'::text, '[Papas fritas] Papas fritas con cazuela de mayo.'::text, 10000),
    ('entrada'::text, 'Papas con queso'::text, '[Papas fritas] Papas fritas con queso.'::text, 10500),
    ('entrada'::text, 'Papas cajun'::text, '[Papas fritas] Papas fritas estilo cajun.'::text, 10000),
    ('entrada'::text, 'Papas con huevo'::text, '[Papas fritas] Papas fritas con huevo.'::text, 11000),
    ('entrada'::text, 'Papas Clarke''s'::text, '[Papas fritas] Papas fritas con queso crema, verdeo y pimentón.'::text, 11500),
    ('entrada'::text, 'Papas irlandesas'::text, '[Papas fritas] Papas fritas con beans, frijoles blancos con salsa de tomate.'::text, 11500),
    ('entrada'::text, 'Adicional panceta'::text, '[Papas fritas] Adicional panceta.'::text, 2800),
    ('bebida'::text, 'Cuba Libre'::text, '[Cocktails - Ron] Ron, gaseosa cola y limón.'::text, 7000),
    ('bebida'::text, 'Mojito'::text, '[Cocktails - Ron] Ron, menta, jugo de limón, soda y azúcar.'::text, 7500),
    ('bebida'::text, 'Apple Mojito'::text, '[Cocktails - Ron] Ron, menta, jugo de limón, soda, triple sec, azúcar, jengibre y angostura.'::text, 7800),
    ('bebida'::text, 'Ginger Mojito'::text, '[Cocktails - Ron] Ron, menta, jugo de limón, soda, triple sec, azúcar, jengibre y angostura.'::text, 8000),
    ('bebida'::text, 'Daiquiri'::text, '[Cocktails - Ron] Ron, pulpa de fruta, jugo de limón y azúcar.'::text, 7800),
    ('bebida'::text, 'Ames'::text, '[Cocktails - Ron] Ron, rodajas de limón, naranja, pomelo rosado, jugo de naranja y azúcar.'::text, 7800),
    ('bebida'::text, 'Stacey Malibú'::text, '[Cocktails - Ron] Ron, licor de coco, gaseosa cola y limón.'::text, 7000),
    ('bebida'::text, 'Martini'::text, '[Cocktails - Gin] Gin, vermouth dry y aceituna.'::text, 7800),
    ('bebida'::text, 'Sweet Martini'::text, '[Cocktails - Gin] Gin, vermouth rosso y cereza.'::text, 7800),
    ('bebida'::text, 'Gin Tonic'::text, '[Cocktails - Gin] Gin, agua tónica y limón.'::text, 5500),
    ('bebida'::text, 'Gin Tonic Premium'::text, '[Cocktails - Gin] Gin, agua tónica y limón. Opción premium.'::text, 6500),
    ('bebida'::text, 'Tom Collins'::text, '[Cocktails - Gin] Gin, jugo de limón, azúcar y soda.'::text, 7200),
    ('bebida'::text, 'Negroni'::text, '[Cocktails - Gin] Gin, vermouth rosso, campari y rodaja de naranja.'::text, 7800),
    ('bebida'::text, 'Destornillador (Screwdriver)'::text, '[Cocktails - Vodka] Vodka y jugo de naranja.'::text, 6500),
    ('bebida'::text, 'Apple Martini'::text, '[Cocktails - Vodka] Vodka, jugo de manzana y jugo de limón.'::text, 6500),
    ('bebida'::text, 'Cosmopolitan'::text, '[Cocktails - Vodka] Vodka, triple sec, jugo de arándanos y jugo de limón.'::text, 7200),
    ('bebida'::text, 'Swing'::text, '[Cocktails - Vodka] Vodka, baileys, ron de coco y vainilla.'::text, 8500),
    ('bebida'::text, 'Sex on the Beach'::text, '[Cocktails - Vodka] Vodka, jugo de durazno y naranja, granadina.'::text, 6800),
    ('bebida'::text, 'Caipivodka'::text, '[Cocktails - Vodka] Vodka, lima y azúcar.'::text, 6800),
    ('bebida'::text, 'White Russian'::text, '[Cocktails - Vodka] Vodka, licor de café espresso, Tia Maria cream y leche.'::text, 6800),
    ('bebida'::text, 'Tequila Shot'::text, '[Cocktails - Tequila] Shot de tequila.'::text, 5500),
    ('bebida'::text, 'Margarita clásico'::text, '[Cocktails - Tequila] Tequila, triple sec y jugo de limón.'::text, 9000),
    ('bebida'::text, 'Margarita frozen'::text, '[Cocktails - Tequila] Tequila, triple sec, limón/frutilla y azúcar.'::text, 9000),
    ('bebida'::text, 'Tequila Sunrise'::text, '[Cocktails - Tequila] Tequila, jugo de naranja y granadina.'::text, 9000),
    ('bebida'::text, 'Chapala'::text, '[Cocktails - Tequila] Tequila, triple sec, jugo de naranja, jugo de limón y granadina.'::text, 9000),
    ('bebida'::text, 'Irish Car Bomb'::text, '[Irish drinks] Cerveza negra, shot de whisky y Tia Maria cream.'::text, 7700),
    ('bebida'::text, 'Arthur Guinness'::text, '[Irish drinks] Cerveza negra y shot de whisky.'::text, 7700),
    ('bebida'::text, 'Irish Martini'::text, '[Irish drinks] Vodka, vermouth dry, irish whiskey y limón.'::text, 9500),
    ('bebida'::text, 'Irish Manhattan'::text, '[Irish drinks] Irish whiskey, vermouth rosso, triple sec, angostura y cereza.'::text, 9500),
    ('bebida'::text, 'Manhattan'::text, '[Whiskey] Bourbon, martini rosso, angostura y cereza.'::text, 11000),
    ('bebida'::text, 'Old Fashioned'::text, '[Whiskey] Bourbon, angostura, rodaja de naranja, cereza y azúcar.'::text, 11000),
    ('bebida'::text, 'Mint Julep'::text, '[Whiskey] Bourbon, menta, limón, soda y azúcar.'::text, 11000),
    ('bebida'::text, 'Boulevardier'::text, '[Whiskey] Bourbon, campari, vermouth rosso y rodaja de naranja.'::text, 11000),
    ('bebida'::text, 'Mr. Jameson'::text, '[Whiskey] Bourbon, jugo de manzana, rodajas de manzana y angostura.'::text, 10000),
    ('bebida'::text, 'Estrella'::text, '[Whiskey] Scotch, Tia Maria cream, Borguetti, licor de chocolate y canela.'::text, 8500),
    ('bebida'::text, 'Penicilin'::text, '[Whiskey] Scotch, miel, limón y jengibre.'::text, 11000),
    ('bebida'::text, 'Vermouth'::text, '[Vermouth] Vermouth rosso, soda, limón o naranja.'::text, 6000),
    ('bebida'::text, 'Ferroviario'::text, '[Vermouth] Vermouth rosso, fernet y soda.'::text, 6700),
    ('bebida'::text, 'Americano'::text, '[Vermouth] Vermouth rosso, campari y soda.'::text, 6700),
    ('bebida'::text, 'Cynar Julep'::text, '[Vermouth] Cynar, menta, limón, pomelo y almíbar.'::text, 7200),
    ('bebida'::text, 'Cynar'::text, '[Vermouth] Cynar, soda y pomelo.'::text, 6500),
    ('bebida'::text, 'Azalea'::text, '[Tragos con helado] Ron, helado, Tia Maria cream y pulpa de frutilla.'::text, 9300),
    ('bebida'::text, 'Sin-door'::text, '[Tragos con helado] Whiskey, helado de crema, Tia Maria cream, Tia Maria y licor de chocolate.'::text, 9300),
    ('bebida'::text, 'Irish Cream'::text, '[Tragos con helado] Helado de crema, Tia Maria cream, cassis y licor de chocolate blanco.'::text, 9300),
    ('bebida'::text, 'Fernet con Coca-Cola'::text, '[Otros] Fernet con Coca-Cola.'::text, 7500),
    ('bebida'::text, 'Fernet medida'::text, '[Otros] Medida de Fernet.'::text, 5500),
    ('bebida'::text, 'Jagger Bomb'::text, '[Otros] Jagermeister y Speed.'::text, 11000),
    ('bebida'::text, 'Jagger Julep'::text, '[Otros] Jagermeister, menta, limón, almíbar y soda.'::text, 11000),
    ('bebida'::text, 'Garibaldi'::text, '[Otros] Campari y jugo de naranja.'::text, 7000),
    ('bebida'::text, 'Caipirinha'::text, '[Otros] Cachaça, lima y azúcar.'::text, 7000),
    ('bebida'::text, 'Baileys'::text, '[Otros] Baileys.'::text, 9500),
    ('bebida'::text, 'Caipicoco'::text, '[Otros] Cachaça, ron de coco, jugo de lima y azúcar.'::text, 6500),
    ('bebida'::text, 'Tabla de 10 shots - hasta 2 variedades'::text, '[Shots] Tabla de 10 shots, hasta 2 variedades.'::text, 18000),
    ('bebida'::text, 'Tabla de 10 shots - más de 2 variedades'::text, '[Shots] Tabla de 10 shots, más de 2 variedades.'::text, 20000),
    ('bebida'::text, 'Shot individual'::text, '[Shots] Shot individual.'::text, 2500),
    ('bebida'::text, 'Brain Hemmorrhage'::text, '[Shots] Tia Maria, whiskey y Tia Maria cream.'::text, 2500),
    ('bebida'::text, 'Baby Guinnes'::text, '[Shots] Tia Maria y Tia Maria cream.'::text, 2500),
    ('bebida'::text, 'Irish Flag'::text, '[Shots] Licor de menta, Tia Maria cream y cognac.'::text, 2500),
    ('bebida'::text, 'After 8'::text, '[Shots] Licor de menta y chocolate, Tia Maria cream.'::text, 2500),
    ('bebida'::text, 'Brain Damage'::text, '[Shots] Amaretto, whiskey y Tia Maria cream.'::text, 2500),
    ('bebida'::text, 'Sweet Injury'::text, '[Shots] Licor de durazno, ron y Tia Maria cream.'::text, 2500),
    ('bebida'::text, 'Bob Marley'::text, '[Shots] Granadina, licor de durazno y menta.'::text, 2500),
    ('bebida'::text, 'Vodka Canela'::text, '[Shots] Vodka, jugo de manzana y canela.'::text, 2500),
    ('bebida'::text, 'Kiwika'::text, '[Shots] Vodka, licor de melon y granadina.'::text, 2500),
    ('bebida'::text, 'B-52'::text, '[Shots] Tia Maria, Tia Maria cream y triple sec.'::text, 2500)
) as m(code, name, description, price_ars) on m.code = c.code
where not exists (
  select 1 from public.menu_items mi
  where mi.restaurant_id = r.id and mi.name = m.name
);

-- ── 4. Mesas 1–30 ────────────────────────────────────────────────────────────
insert into public.restaurant_tables (restaurant_id, table_number, status, qr_token)
select r.id, n.n::text, 'libre', 'clarkes-mesa-' || n.n::text
from public.restaurants r
cross join generate_series(1, 30) as n(n)
where r.slug = 'clarkes'
  and not exists (
    select 1 from public.restaurant_tables rt
    where rt.restaurant_id = r.id and rt.table_number = n.n::text
  );
