-- ============================================================
-- Plataforma de Gestión de Licencias Digitales
-- SQL Migration — ejecutar en Supabase SQL Editor
-- ============================================================

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  role       text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Products ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique not null,
  description       text,
  short_description text,
  type              text check (type in ('software', 'ebook', 'course', 'template')),
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  thumbnail_url     text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── License Plans ────────────────────────────────────────────────────────────
create table if not exists license_plans (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products on delete cascade,
  name              text not null,
  type              text not null check (type in ('perpetual', 'subscription', 'trial')),
  price             integer not null,
  currency          text not null default 'usd',
  billing_interval  text check (billing_interval in ('month', 'year')),
  trial_days        integer,
  max_activations   integer not null default 1,
  features          jsonb not null default '[]',
  is_active         boolean not null default true,
  stripe_price_id   text,
  stripe_product_id text,
  created_at        timestamptz default now()
);

-- ─── Coupons ──────────────────────────────────────────────────────────────────
create table if not exists coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text unique not null,
  type             text not null check (type in ('percentage', 'fixed')),
  value            integer not null,
  min_order_amount integer,
  max_uses         integer,
  used_count       integer not null default 0,
  is_active        boolean not null default true,
  expires_at       timestamptz,
  created_at       timestamptz default now()
);

-- función para incrementar uso de cupón de forma segura
create or replace function increment_coupon_usage(p_coupon_id uuid)
returns void language plpgsql security definer as $$
begin
  update coupons set used_count = used_count + 1 where id = p_coupon_id;
end;
$$;

-- ─── Orders ───────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users,
  status                 text not null default 'pending'
                           check (status in ('pending', 'completed', 'refunded', 'failed')),
  total_amount           integer not null,
  discount_amount        integer not null default 0,
  stripe_session_id      text unique,
  stripe_payment_intent  text,
  stripe_subscription_id text,
  coupon_id              uuid references coupons,
  created_at             timestamptz default now()
);

-- ─── Order Items ──────────────────────────────────────────────────────────────
create table if not exists order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references orders on delete cascade,
  product_id      uuid not null references products,
  license_plan_id uuid not null references license_plans,
  price           integer not null,
  created_at      timestamptz default now()
);

-- ─── Licenses ─────────────────────────────────────────────────────────────────
create table if not exists licenses (
  id                     uuid primary key default gen_random_uuid(),
  license_key            text unique not null,
  user_id                uuid not null references auth.users,
  product_id             uuid not null references products,
  license_plan_id        uuid not null references license_plans,
  order_item_id          uuid references order_items,
  status                 text not null default 'active'
                           check (status in ('active', 'expired', 'revoked', 'suspended', 'trial')),
  type                   text not null check (type in ('perpetual', 'subscription', 'trial')),
  max_activations        integer not null default 1,
  activation_count       integer not null default 0,
  issued_at              timestamptz not null default now(),
  expires_at             timestamptz,
  revoked_at             timestamptz,
  revocation_reason      text,
  stripe_subscription_id text,
  metadata               jsonb not null default '{}',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ─── License Activations ──────────────────────────────────────────────────────
create table if not exists license_activations (
  id                 uuid primary key default gen_random_uuid(),
  license_id         uuid not null references licenses on delete cascade,
  machine_id         text not null,
  machine_name       text,
  ip_address         text,
  is_active          boolean not null default true,
  first_activated_at timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  unique (license_id, machine_id)
);

-- ─── License Events ───────────────────────────────────────────────────────────
create table if not exists license_events (
  id          uuid primary key default gen_random_uuid(),
  license_id  uuid not null references licenses,
  event_type  text not null check (event_type in (
                'issued', 'activated', 'deactivated', 'verified',
                'expired', 'revoked', 'suspended', 'renewed', 'reactivated'
              )),
  machine_id  text,
  ip_address  text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products on delete cascade,
  user_id     uuid not null references auth.users,
  license_id  uuid not null references licenses,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  body        text,
  is_approved boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ─── Índices de rendimiento ───────────────────────────────────────────────────
create index if not exists idx_licenses_license_key   on licenses (license_key);
create index if not exists idx_licenses_user_id       on licenses (user_id);
create index if not exists idx_licenses_product_id    on licenses (product_id);
create index if not exists idx_licenses_status        on licenses (status);
create index if not exists idx_activations_license_id on license_activations (license_id);
create index if not exists idx_activations_machine_id on license_activations (machine_id);
create index if not exists idx_events_license_id      on license_events (license_id);
create index if not exists idx_orders_user_id         on orders (user_id);
create index if not exists idx_order_items_order_id   on order_items (order_id);
create index if not exists idx_reviews_product_id     on reviews (product_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- profiles
alter table profiles enable row level security;
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Admin reads all profiles"
  on profiles for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- products
alter table products enable row level security;
create policy "Anyone reads published products"
  on products for select using (status = 'published');
create policy "Admin full access to products"
  on products for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- license_plans
alter table license_plans enable row level security;
create policy "Anyone reads active plans of published products"
  on license_plans for select using (
    is_active = true and
    exists (select 1 from products where products.id = license_plans.product_id and products.status = 'published')
  );
create policy "Admin full access to license_plans"
  on license_plans for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- coupons
alter table coupons enable row level security;
create policy "Admin full access to coupons"
  on coupons for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- orders
alter table orders enable row level security;
create policy "Users read own orders"
  on orders for select using (user_id = auth.uid());
create policy "Admin reads all orders"
  on orders for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- order_items
alter table order_items enable row level security;
create policy "Users read own order items"
  on order_items for select using (
    exists (
      select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );
create policy "Admin reads all order items"
  on order_items for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- licenses
alter table licenses enable row level security;
create policy "Users read own licenses"
  on licenses for select using (user_id = auth.uid());
create policy "Admin full access to licenses"
  on licenses for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- license_activations
alter table license_activations enable row level security;
create policy "Users read activations of own licenses"
  on license_activations for select using (
    exists (
      select 1 from licenses where licenses.id = license_activations.license_id and licenses.user_id = auth.uid()
    )
  );

-- license_events
alter table license_events enable row level security;
create policy "Admin reads all license events"
  on license_events for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- reviews
alter table reviews enable row level security;
create policy "Anyone reads approved reviews"
  on reviews for select using (is_approved = true);
create policy "Users manage own reviews"
  on reviews for all using (user_id = auth.uid());
create policy "Admin manages all reviews"
  on reviews for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─── File delivery ────────────────────────────────────────────────────────────
-- Run this after the initial migration if upgrading an existing database

alter table products
  add column if not exists file_path text;          -- path in Supabase Storage bucket 'product-files'

-- Storage bucket (run in Supabase Dashboard → Storage, or via SQL):
-- insert into storage.buckets (id, name, public)
--   values ('product-files', 'product-files', false)
--   on conflict do nothing;

-- RLS for storage: only authenticated users with a valid license can read
-- This is handled via the signed URL API route — the bucket stays private.

-- Allow service_role to manage files (handled automatically by Supabase)

-- Sesión 12: cancelación de suscripciones por el usuario
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- Sesión 18: ocultar licencias del dashboard (hide/archive)
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
