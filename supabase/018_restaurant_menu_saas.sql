-- Multi-restaurant menu SaaS: per-restaurant images, themes, dynamic categories.
-- Safe to run multiple times.

-- ── restaurants: optional images + theme ─────────────────────────────────────
alter table public.restaurants
  add column if not exists show_product_images boolean not null default true;

alter table public.restaurants
  add column if not exists theme jsonb;

-- demo-ordee keeps default ORDEE look
update public.restaurants
set show_product_images = true, theme = null
where slug = 'demo-ordee';

-- ── menu_categories: allow any code per restaurant (drop 4-value CHECK) ─────
alter table public.menu_categories
  drop constraint if exists menu_categories_code_check;

create unique index if not exists menu_categories_restaurant_code_unique
  on public.menu_categories (restaurant_id, code);

-- Phase 5 (future, out of scope): Supabase Storage bucket `menu-images` (public read),
-- path `{restaurant_slug}/{menu_item_id}.webp`, staff upload via ORDEE-COCINA admin.
