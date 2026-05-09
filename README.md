# ORDEE-MVP (Cliente)

Web cliente para menu digital, carrito, checkout y envio de pedidos a ORDEE-COCINA.

## Requisitos

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_TRANSFER_ALIAS
- NEXT_PUBLIC_KITCHEN_WEB_URL
- MERCADOPAGO_ACCESS_TOKEN (opcional para cobro directo MP)

## SQL en Supabase (orden)

1. `supabase/001_init.sql`
2. `supabase/002_auth_roles_rls.sql`
3. `supabase/003_seed_demo_menu.sql`
4. `supabase/004_quickstart_demo_staff.sql`
5. `supabase/006_staff_panel_extensions.sql`
6. `supabase/007_menu_images.sql`
7. `supabase/008_expand_menu_40_items.sql`
8. `supabase/009_views_products_tables.sql`
9. `supabase/010_realtime_core_tables.sql`
10. `supabase/011_restaurant_demo_bootstrap.sql` (opcional; la app crea el restaurant si falta)

## Ejecutar

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abrir: http://localhost:3000

## Login temporal

- Mail: cualquiera valido
- Password: `123456789`

## Funcionalidades MVP

- Menu por categorias con barra sticky y scroll suave
- Carrito persistente local
- Checkout con selector de pago:
  - Mercado Pago
  - Transferencia
  - Naranja X
  - Modo
  - Otro medio
- Registro real en Supabase (`orders`, `order_items`, `payments`)
- Boton fijo `Necesito ayuda` -> `help_requests`
- Seguimiento en vivo del estado de pedido en checkout

## Conexion con ORDEE-COCINA

Cuando cliente confirma pedido y pago, se guarda en DB y aparece en panel staff automaticamente.

## Deploy Vercel

- Crear proyecto Vercel para `ordee-mvp`
- Configurar variables de entorno igual que `.env.local`
- Deploy
