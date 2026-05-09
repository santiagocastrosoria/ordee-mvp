alter table menu_items add column if not exists image_url text;

with mapping(name, image_url) as (
  values
    ('Papas fritas', '/products/papas-fritas.jpg'),
    ('Bruschettas', '/products/bruschettas.jpg'),
    ('Nachos', '/products/nachos.jpg'),
    ('Aros de cebolla', '/products/aros-cebolla.jpg'),
    ('Empanadas', '/products/empanadas.jpg'),
    ('Provoleta', '/products/provoleta.jpg'),
    ('Rabas', '/products/rabas.jpg'),
    ('Tabla de fiambres', '/products/tabla-fiambres.jpg'),
    ('Bastones mozzarella', '/products/bastones-mozzarella.jpg'),
    ('Nuggets', '/products/nuggets.jpg'),

    ('Hamburguesa', '/products/hamburguesa.jpg'),
    ('Pizza', '/products/pizza.jpg'),
    ('Carne', '/products/carne.jpg'),
    ('Milanesa', '/products/milanesa.jpg'),
    ('Pasta', '/products/pasta.jpg'),
    ('Ensalada Caesar', '/products/ensalada-caesar.jpg'),
    ('Sushi', '/products/sushi.jpg'),
    ('Lomito', '/products/lomito.jpg'),
    ('Pollo grillado', '/products/pollo-grillado.jpg'),
    ('Tacos', '/products/tacos.jpg'),

    ('Coca Cola', '/products/coca-cola.jpg'),
    ('Sprite', '/products/sprite.jpg'),
    ('Limonada', '/products/limonada.jpg'),
    ('Agua mineral', '/products/agua-mineral.jpg'),
    ('Vino tinto', '/products/vino-tinto.jpg'),
    ('Vino blanco', '/products/vino-blanco.jpg'),
    ('Fernet', '/products/fernet.jpg'),
    ('Gin tonic', '/products/gin-tonic.jpg'),
    ('Cerveza', '/products/cerveza.jpg'),
    ('Jugo natural', '/products/jugo-natural.jpg'),

    ('Cheesecake', '/products/cheesecake.jpg'),
    ('Helado', '/products/helado.jpg'),
    ('Brownie', '/products/brownie.jpg'),
    ('Tiramisú', '/products/tiramisu.jpg'),
    ('Tiramisu', '/products/tiramisu.jpg'),
    ('Flan', '/products/flan.jpg'),
    ('Panqueques', '/products/panqueques.jpg'),
    ('Lemon pie', '/products/lemon-pie.jpg'),
    ('Chocotorta', '/products/chocotorta.jpg'),
    ('Mousse', '/products/mousse.jpg'),
    ('Volcán de chocolate', '/products/volcan-chocolate.jpg'),
    ('Volcan de chocolate', '/products/volcan-chocolate.jpg')
)
update menu_items mi
set image_url = m.image_url
from mapping m
where mi.name = m.name;

update menu_items
set image_url = '/products/pizza.jpg'
where image_url is null;
