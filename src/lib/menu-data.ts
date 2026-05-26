import { MenuItem } from "@/lib/types";

const local = (file: string) => `/products/${file}`;

export const menuItems: MenuItem[] = [
  { id: "e-1", category: "entrada", name: "Papas fritas", description: "Crujientes con sal marina", price: 2800, imageUrl: local("papas-fritas.jpg"), popular: true },
  { id: "e-2", category: "entrada", name: "Bruschettas", description: "Tomate, albahaca y oliva", price: 3200, imageUrl: local("bruschettas.jpg") },
  { id: "e-3", category: "entrada", name: "Nachos", description: "Con cheddar y pico de gallo", price: 3600, imageUrl: local("nachos.jpg") },
  { id: "e-4", category: "entrada", name: "Aros de cebolla", description: "Rebozado dorado", price: 3100, imageUrl: local("aros-cebolla.jpg") },
  { id: "e-5", category: "entrada", name: "Empanadas", description: "Carne cortada a cuchillo", price: 3500, imageUrl: local("empanadas.jpg") },
  { id: "e-6", category: "entrada", name: "Provoleta", description: "Queso grillado", price: 3900, imageUrl: local("provoleta.jpg") },
  { id: "e-7", category: "entrada", name: "Rabas", description: "Con limon fresco", price: 5400, imageUrl: local("rabas.jpg") },
  { id: "e-8", category: "entrada", name: "Tabla de fiambres", description: "Variedad premium", price: 6100, imageUrl: local("tabla-fiambres.jpg") },
  { id: "e-9", category: "entrada", name: "Bastones mozzarella", description: "Con salsa pomodoro", price: 3700, imageUrl: local("bastones-mozzarella.jpg") },
  { id: "e-10", category: "entrada", name: "Nuggets", description: "Pollo crocante", price: 3300, imageUrl: local("nuggets.jpg") },

  { id: "p-1", category: "principal", name: "Hamburguesa", description: "Doble carne y cheddar", price: 7200, imageUrl: local("hamburguesa.jpg"), popular: true },
  { id: "p-2", category: "principal", name: "Pizza", description: "Muzzarella y albahaca", price: 8400, imageUrl: local("pizza.jpg") },
  { id: "p-3", category: "principal", name: "Carne", description: "Bife de chorizo con guarnicion", price: 9800, imageUrl: local("carne.jpg") },
  { id: "p-4", category: "principal", name: "Milanesa", description: "Napolitana con papas", price: 8600, imageUrl: local("milanesa.jpg") },
  { id: "p-5", category: "principal", name: "Pasta", description: "Salsa fileto o crema", price: 6900, imageUrl: local("pasta.jpg") },
  { id: "p-6", category: "principal", name: "Ensalada Caesar", description: "Pollo, croutons y parmesano", price: 6400, imageUrl: local("ensalada-caesar.jpg") },
  { id: "p-7", category: "principal", name: "Sushi", description: "Tabla combinada x15", price: 11900, imageUrl: local("sushi.jpg") },
  { id: "p-8", category: "principal", name: "Lomito", description: "Con huevo y cheddar", price: 7800, imageUrl: local("lomito.jpg") },
  { id: "p-9", category: "principal", name: "Pollo grillado", description: "Con vegetales al horno", price: 7600, imageUrl: local("pollo-grillado.jpg") },
  { id: "p-10", category: "principal", name: "Tacos", description: "Carne braseada x3", price: 7300, imageUrl: local("tacos.jpg") },

  { id: "b-1", category: "bebida", name: "Coca Cola", description: "Botella 500ml", price: 2400, imageUrl: local("coca-cola.jpg") },
  { id: "b-2", category: "bebida", name: "Sprite", description: "Botella 500ml", price: 2400, imageUrl: local("sprite.jpg") },
  { id: "b-3", category: "bebida", name: "Limonada", description: "Menta y jengibre", price: 2900, imageUrl: local("limonada.jpg") },
  { id: "b-4", category: "bebida", name: "Agua mineral", description: "Con o sin gas", price: 1800, imageUrl: local("agua-mineral.jpg") },
  { id: "b-5", category: "bebida", name: "Vino tinto", description: "Copa malbec", price: 3800, imageUrl: local("vino-tinto.jpg") },
  { id: "b-6", category: "bebida", name: "Vino blanco", description: "Copa chardonnay", price: 3800, imageUrl: local("vino-blanco.jpg") },
  { id: "b-7", category: "bebida", name: "Fernet", description: "Fernet con cola", price: 4100, imageUrl: local("fernet.jpg") },
  { id: "b-8", category: "bebida", name: "Gin tonic", description: "Gin premium y tonica", price: 4700, imageUrl: local("gin-tonic.jpg") },
  { id: "b-9", category: "bebida", name: "Cerveza", description: "Pinta tirada", price: 3600, imageUrl: local("cerveza.jpg") },
  { id: "b-10", category: "bebida", name: "Jugo natural", description: "Naranja exprimida", price: 2600, imageUrl: local("jugo-natural.jpg") },

  { id: "d-1", category: "postre", name: "Cheesecake", description: "Frutos rojos", price: 4300, imageUrl: local("cheesecake.jpg") },
  { id: "d-2", category: "postre", name: "Helado", description: "Dos bochas", price: 3200, imageUrl: local("helado.jpg") },
  { id: "d-3", category: "postre", name: "Brownie", description: "Con helado de vainilla", price: 3900, imageUrl: local("brownie.jpg") },
  { id: "d-4", category: "postre", name: "Tiramisú", description: "Receta italiana", price: 4200, imageUrl: local("tiramisu.jpg") },
  { id: "d-5", category: "postre", name: "Flan", description: "Con dulce de leche", price: 3000, imageUrl: local("flan.jpg") },
  { id: "d-6", category: "postre", name: "Panqueques", description: "Con manjar", price: 3400, imageUrl: local("panqueques.jpg") },
  { id: "d-7", category: "postre", name: "Lemon pie", description: "Crema de limon y merengue", price: 3800, imageUrl: local("lemon-pie.jpg") },
  { id: "d-8", category: "postre", name: "Chocotorta", description: "Clasica argentina", price: 3600, imageUrl: local("chocotorta.jpg") },
  { id: "d-9", category: "postre", name: "Mousse", description: "Chocolate semi amargo", price: 3300, imageUrl: local("mousse.jpg") },
  { id: "d-10", category: "postre", name: "Volcán de chocolate", description: "Centro fundido", price: 4500, imageUrl: local("volcan-chocolate.jpg") },

  // TEMP — test product for MercadoPago real payment testing. Remove when done.
  { id: "d-test-mp", category: "postre", name: "Prueba MP Real", description: "Test de pago — borrar después", price: 10, imageUrl: local("cheesecake.jpg") }
];

export const categoryLabels = {
  entrada: "Entrada",
  principal: "Principal",
  bebida: "Bebida",
  postre: "Postre"
};
