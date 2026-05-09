-- Asegura al menos 10 productos por categoria para demo comercial

with resto as (
  select id from restaurants where slug = 'demo-ordee' limit 1
), cat as (
  select id, code from menu_categories where restaurant_id = (select id from resto)
), items(code, name, description, price_ars, image_url) as (
  values
    ('entrada'::text, 'Papas fritas'::text, 'Crujientes con sal marina'::text, 2800, '/products/papas-fritas.jpg'::text),
    ('entrada','Bruschettas','Tomate, albahaca y oliva',3200,'/products/bruschettas.jpg'),
    ('entrada','Nachos','Con cheddar y pico de gallo',3600,'/products/nachos.jpg'),
    ('entrada','Aros de cebolla','Rebozado dorado',3100,'/products/aros-cebolla.jpg'),
    ('entrada','Empanadas','Carne cortada a cuchillo',3500,'/products/empanadas.jpg'),
    ('entrada','Provoleta','Queso grillado',3900,'/products/provoleta.jpg'),
    ('entrada','Rabas','Con limon fresco',5400,'/products/rabas.jpg'),
    ('entrada','Tabla de fiambres','Variedad premium',6100,'/products/tabla-fiambres.jpg'),
    ('entrada','Bastones mozzarella','Con salsa pomodoro',3700,'/products/bastones-mozzarella.jpg'),
    ('entrada','Nuggets','Pollo crocante',3300,'/products/nuggets.jpg'),

    ('principal','Hamburguesa','Doble carne y cheddar',7200,'/products/hamburguesa.jpg'),
    ('principal','Pizza','Muzzarella y albahaca',8400,'/products/pizza.jpg'),
    ('principal','Carne','Bife de chorizo con guarnicion',9800,'/products/carne.jpg'),
    ('principal','Milanesa','Napolitana con papas',8600,'/products/milanesa.jpg'),
    ('principal','Pasta','Salsa fileto o crema',6900,'/products/pasta.jpg'),
    ('principal','Ensalada Caesar','Pollo, croutons y parmesano',6400,'/products/ensalada-caesar.jpg'),
    ('principal','Sushi','Tabla combinada x15',11900,'/products/sushi.jpg'),
    ('principal','Lomito','Con huevo y cheddar',7800,'/products/lomito.jpg'),
    ('principal','Pollo grillado','Con vegetales al horno',7600,'/products/pollo-grillado.jpg'),
    ('principal','Tacos','Carne braseada x3',7300,'/products/tacos.jpg'),

    ('bebida','Coca Cola','Botella 500ml',2400,'/products/coca-cola.jpg'),
    ('bebida','Sprite','Botella 500ml',2400,'/products/sprite.jpg'),
    ('bebida','Limonada','Menta y jengibre',2900,'/products/limonada.jpg'),
    ('bebida','Agua mineral','Con o sin gas',1800,'/products/agua-mineral.jpg'),
    ('bebida','Vino tinto','Copa malbec',3800,'/products/vino-tinto.jpg'),
    ('bebida','Vino blanco','Copa chardonnay',3800,'/products/vino-blanco.jpg'),
    ('bebida','Fernet','Fernet con cola',4100,'/products/fernet.jpg'),
    ('bebida','Gin tonic','Gin premium y tonica',4700,'/products/gin-tonic.jpg'),
    ('bebida','Cerveza','Pinta tirada',3600,'/products/cerveza.jpg'),
    ('bebida','Jugo natural','Naranja exprimida',2600,'/products/jugo-natural.jpg'),

    ('postre','Cheesecake','Frutos rojos',4300,'/products/cheesecake.jpg'),
    ('postre','Helado','Dos bochas',3200,'/products/helado.jpg'),
    ('postre','Brownie','Con helado de vainilla',3900,'/products/brownie.jpg'),
    ('postre','Tiramisú','Receta italiana',4200,'/products/tiramisu.jpg'),
    ('postre','Flan','Con dulce de leche',3000,'/products/flan.jpg'),
    ('postre','Panqueques','Con manjar',3400,'/products/panqueques.jpg'),
    ('postre','Lemon pie','Crema de limon y merengue',3800,'/products/lemon-pie.jpg'),
    ('postre','Chocotorta','Clasica argentina',3600,'/products/chocotorta.jpg'),
    ('postre','Mousse','Chocolate semi amargo',3300,'/products/mousse.jpg'),
    ('postre','Volcán de chocolate','Centro fundido',4500,'/products/volcan-chocolate.jpg')
)
insert into menu_items (restaurant_id, category_id, name, description, price_ars, image_url, is_active)
select (select id from resto), c.id, i.name, i.description, i.price_ars, i.image_url, true
from items i
join cat c on c.code = i.code
where not exists (
  select 1 from menu_items mi
  where mi.restaurant_id = (select id from resto)
    and mi.name = i.name
);
