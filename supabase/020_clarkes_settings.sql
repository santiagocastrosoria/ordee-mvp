-- Clarke's menu settings: no product images + burgundy theme.
-- Run after 018_restaurant_menu_saas.sql (and ideally 019_clarkes_real_categories.sql).

update public.restaurants
set
  show_product_images = false,
  theme = '{
    "bg": "#2a0a12",
    "card": "#3d1520",
    "soft": "#4a1a28",
    "border": "#5c2433",
    "muted": "#c4a0a8",
    "ink": "#faf5f0",
    "accent": "#8b1a2d",
    "accentFg": "#ffffff"
  }'::jsonb
where slug = 'clarkes';
