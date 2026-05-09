-- Usuario demo unificado (misma cuenta para probar cliente en ordee-mvp y staff en ordee-kitchen-web).
-- IMPORTANTE: solo para entorno de prueba. Cambia la contrasena en produccion.
-- Ejecutar despues de 001, 002 y tener restaurante demo-ordee.
--
-- Email:    scastrosoria@gmail.com
-- Password: 123456789
--
-- Rol dueno: puede ver y actualizar pedidos en la web de cocina (RLS).

create extension if not exists pgcrypto;

do $$
declare
  resto_id uuid;
  user_id uuid := '33333333-3333-3333-3333-333333333333';
  default_instance_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  select id into resto_id from restaurants where slug = 'demo-ordee' limit 1;

  if resto_id is null then
    raise exception 'No existe restaurant slug demo-ordee. Ejecuta los scripts anteriores.';
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    default_instance_id,
    user_id,
    'authenticated',
    'authenticated',
    'scastrosoria@gmail.com',
    crypt('123456789', gen_salt('bf')),
    now(),
    now(),
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Santiago Castro"}',
    now(),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      updated_at = now();

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    user_id,
    jsonb_build_object('sub', user_id::text, 'email', 'scastrosoria@gmail.com'),
    'email',
    user_id::text,
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do nothing;

  insert into profiles (id, restaurant_id, role, full_name)
  values (user_id, resto_id, 'dueno', 'Santiago Castro')
  on conflict (id) do update
  set restaurant_id = excluded.restaurant_id,
      role = excluded.role,
      full_name = excluded.full_name;
end $$;
