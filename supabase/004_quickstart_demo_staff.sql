-- Quickstart 5 minutos:
-- Crea usuarios demo en auth + perfiles con rol para dueno y cocina.
-- Credenciales demo:
--   dueno@ordee.demo  /  Demo1234!
--   cocina@ordee.demo /  Demo1234!

create extension if not exists pgcrypto;

insert into restaurants (name, slug)
values ('ORDEE Demo', 'demo-ordee')
on conflict (slug) do nothing;

do $$
declare
  resto_id uuid;
  dueno_id uuid := '11111111-1111-1111-1111-111111111111';
  cocina_id uuid := '22222222-2222-2222-2222-222222222222';
  default_instance_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  select id into resto_id from restaurants where slug = 'demo-ordee' limit 1;

  -- auth.users: dueno
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
    dueno_id,
    'authenticated',
    'authenticated',
    'dueno@ordee.demo',
    crypt('Demo1234!', gen_salt('bf')),
    now(),
    now(),
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dueno Demo"}',
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
    dueno_id,
    jsonb_build_object('sub', dueno_id::text, 'email', 'dueno@ordee.demo'),
    'email',
    dueno_id::text,
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do nothing;

  -- auth.users: cocina
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
    cocina_id,
    'authenticated',
    'authenticated',
    'cocina@ordee.demo',
    crypt('Demo1234!', gen_salt('bf')),
    now(),
    now(),
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Cocina Demo"}',
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
    cocina_id,
    jsonb_build_object('sub', cocina_id::text, 'email', 'cocina@ordee.demo'),
    'email',
    cocina_id::text,
    now(),
    now(),
    now()
  )
  on conflict (provider, provider_id) do nothing;

  insert into profiles (id, restaurant_id, role, full_name)
  values
    (dueno_id, resto_id, 'dueno', 'Dueno Demo'),
    (cocina_id, resto_id, 'cocina', 'Cocina Demo')
  on conflict (id) do update
  set restaurant_id = excluded.restaurant_id,
      role = excluded.role,
      full_name = excluded.full_name;
end $$;
