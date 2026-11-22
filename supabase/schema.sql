-- IMAGIE CRÉATION — schéma de départ pour Supabase/PostgreSQL.
-- À exécuter et tester dans le projet Supabase du propriétaire; ne jamais publier la clé service_role.

create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('customer', 'admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum (
  'received', 'awaiting_confirmation', 'payment_pending', 'confirmed',
  'in_preparation', 'in_production', 'shipped', 'ready_for_pickup',
  'delivered', 'cancelled', 'refunded'
); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('unpaid', 'pending_review', 'authorized', 'paid', 'failed', 'refunded'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  preferred_language text not null default 'fr',
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  sku text not null unique,
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  currency char(3) not null default 'USD',
  price_status text not null default 'to_be_set',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  track_inventory boolean not null default true,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  label jsonb not null default '{}'::jsonb,
  option_values jsonb not null default '{}'::jsonb,
  price_adjustment numeric(12,2) not null default 0,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  country text not null,
  region text,
  city text not null,
  street_address text not null,
  postal_code text,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  status public.order_status not null default 'received',
  payment_status public.payment_status not null default 'unpaid',
  payment_method text,
  currency char(3) not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  shipping_address jsonb,
  customer_note text,
  tracking_token_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku_snapshot text not null,
  name_snapshot text not null,
  variant_snapshot jsonb not null default '{}'::jsonb,
  unit_price numeric(12,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  service_type text not null,
  quantity integer,
  dimensions text,
  deadline date,
  details text not null,
  attachment_path text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount numeric(12,2) not null,
  currency char(3) not null default 'USD',
  status public.payment_status not null default 'pending_review',
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name jsonb not null default '{}'::jsonb,
  discount_type text not null check (discount_type in ('fixed', 'percent')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Create a profile when Supabase Auth creates a user. The role is always customer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_language, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'fr'),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.sync_auth_user_email();

-- Backfill email values for accounts that existed before this schema was installed.
update public.profiles p
   set email = u.email, updated_at = now()
  from auth.users u
 where p.id = u.id and p.email is distinct from u.email;

-- Prevent users from granting themselves admin privileges.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'Role change is not permitted';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
before update on public.profiles
for each row execute procedure public.prevent_self_role_change();

-- Enable RLS on all customer/business tables.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quote_requests enable row level security;
alter table public.payments enable row level security;
alter table public.promotions enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users can read/update their own non-role fields; admins can read all.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, preferred_language) on public.profiles to authenticated;

-- Public storefront reads active catalog; only admins write catalog.
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
for select to anon, authenticated using (active or public.is_admin());
drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists images_public_read on public.product_images;
create policy images_public_read on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id and (p.is_active or public.is_admin()))
);
drop policy if exists images_admin_all on public.product_images;
create policy images_admin_all on public.product_images
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants
for select to anon, authenticated using (
  active and exists (select 1 from public.products p where p.id = product_id and p.is_active)
  or public.is_admin()
);
drop policy if exists variants_admin_all on public.product_variants;
create policy variants_admin_all on public.product_variants
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Addresses are private to owner/admin.
drop policy if exists addresses_owner_or_admin on public.addresses;
create policy addresses_owner_or_admin on public.addresses
for all to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Customer orders: customer can only read their own. Creation must be through a validated server-side checkout function.
drop policy if exists orders_customer_read on public.orders;
create policy orders_customer_read on public.orders
for select to authenticated
using (user_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists orders_admin_read_all on public.orders;
create policy orders_admin_read_all on public.orders
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Order items follow parent order ownership.
drop policy if exists order_items_owner_or_admin_read on public.order_items;
create policy order_items_owner_or_admin_read on public.order_items
for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
drop policy if exists order_items_admin_all on public.order_items;
create policy order_items_admin_all on public.order_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists quote_owner_read on public.quote_requests;
create policy quote_owner_read on public.quote_requests
for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists quote_customer_insert on public.quote_requests;
create policy quote_customer_insert on public.quote_requests
for insert to authenticated with check (
  user_id = auth.uid()
  and status = 'new'
  and char_length(trim(details)) between 10 and 4000
  and exists (
    select 1 from public.customer_memberships m
    where m.user_id = auth.uid() and m.status = 'active' and m.community_terms_accepted_at is not null
  )
  and (attachment_path is null or attachment_path like auth.uid()::text || '/quotes/%')
);
drop policy if exists quote_admin_update on public.quote_requests;
create policy quote_admin_update on public.quote_requests
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Payment details are admin-only; never store card numbers or security codes here.
drop policy if exists payments_admin_only on public.payments;
create policy payments_admin_only on public.payments
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Promotions readable only when active to customers; admins manage all.
drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions
for select to anon, authenticated using (active or public.is_admin());
drop policy if exists promotions_admin_all on public.promotions;
create policy promotions_admin_all on public.promotions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Audit logs are private to admins.
drop policy if exists audit_admin_only on public.audit_logs;
create policy audit_admin_only on public.audit_logs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- IMPORTANT FOLLOW-UP BEFORE PRODUCTION:
-- 1) Configure Supabase Auth redirect URLs and Google/Facebook OAuth credentials.
-- 2) Product images use the public/read-only imagie-product-images bucket; customer-artworks is private and owner-scoped.
-- 3) Checkout totals and stock are recalculated in create_order_from_cart (SECURITY DEFINER); never trust browser totals.
-- 4) Deploy verify-turnstile for pre-OAuth CAPTCHA and enable Supabase's native Auth CAPTCHA for email/password flows.
-- 5) Assign the first admin role manually in the Supabase SQL editor after verifying the owner's auth user ID.
-- 6) Add rate limiting, MFA for admins, backups and audit review before production.


-- Storage buckets and policies (review bucket names and retention before production).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagie-product-images', 'imagie-product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-artworks', 'customer-artworks', false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select to anon, authenticated using (bucket_id = 'imagie-product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert to authenticated with check (bucket_id = 'imagie-product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update to authenticated using (bucket_id = 'imagie-product-images' and public.is_admin())
with check (bucket_id = 'imagie-product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete to authenticated using (bucket_id = 'imagie-product-images' and public.is_admin());

drop policy if exists artwork_owner_insert on storage.objects;
create policy artwork_owner_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'customer-artworks'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.customer_memberships m where m.user_id = auth.uid() and m.status = 'active' and m.community_terms_accepted_at is not null)
);

drop policy if exists artwork_owner_read on storage.objects;
create policy artwork_owner_read on storage.objects
for select to authenticated using (
  bucket_id = 'customer-artworks' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists artwork_owner_delete on storage.objects;
create policy artwork_owner_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'customer-artworks' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);


-- IMAGIE COMMUNITY: comptes clients et avantages membres.
-- Tous les utilisateurs inscrits sont des clients par défaut; l'administration est attribuée manuellement au propriétaire.
alter table public.promotions add column if not exists member_only boolean not null default false;

create table if not exists public.customer_memberships (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  member_number text not null unique default ('IMC-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10))),
  tier text not null default 'community',
  status text not null default 'active' check (status in ('active','paused','blocked')),
  points_balance integer not null default 0 check (points_balance >= 0),
  community_terms_accepted_at timestamptz,
  community_terms_version text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.customer_memberships add column if not exists community_terms_accepted_at timestamptz;
alter table public.customer_memberships add column if not exists community_terms_version text;

create table if not exists public.customer_cart_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sku text not null check (sku ~ '^[A-Za-z0-9._-]{1,60}$'),
  quantity integer not null check (quantity between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, sku)
);

create table if not exists public.member_point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.customer_memberships(user_id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.member_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Membership is created automatically after a successful account registration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, preferred_language, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    nullif(left(new.raw_user_meta_data->>'phone', 30), ''),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'fr'),
    'customer'
  )
  on conflict (id) do nothing;
  -- Never infer legal/community consent from editable user metadata.
  -- A logged-in customer must explicitly confirm through accept_community_terms().
  insert into public.customer_memberships (user_id)
  values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

-- For projects that already had users before this extension, backfill membership rows.
insert into public.customer_memberships (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

alter table public.customer_memberships enable row level security;
alter table public.customer_cart_items enable row level security;

-- Remove an older, broader INSERT policy if this schema is re-applied.
-- The strict quote_customer_insert policy above is the only customer INSERT path.
drop policy if exists quote_member_insert on public.quote_requests;
alter table public.member_point_transactions enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.member_announcements enable row level security;

drop policy if exists membership_read_own_or_admin on public.customer_memberships;
create policy membership_read_own_or_admin on public.customer_memberships
for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists membership_admin_manage on public.customer_memberships;
create policy membership_admin_manage on public.customer_memberships
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists customer_cart_read_own_or_admin on public.customer_cart_items;
create policy customer_cart_read_own_or_admin on public.customer_cart_items
for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- Cart writes are deliberately available only through the validated SECURITY DEFINER RPC below.
grant select on public.customer_cart_items to authenticated;
revoke insert, update, delete on public.customer_cart_items from anon, authenticated;

create or replace function public.accept_community_terms(p_version text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare v_accepted_at timestamptz;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_version is null or length(trim(p_version)) < 3 or length(p_version) > 80 then
    raise exception 'INVALID_TERMS_VERSION';
  end if;
  update public.customer_memberships
     set community_terms_accepted_at = now(), community_terms_version = trim(p_version)
   where user_id = auth.uid() and status = 'active'
   returning community_terms_accepted_at into v_accepted_at;
  if v_accepted_at is null then raise exception 'ACTIVE_MEMBERSHIP_REQUIRED'; end if;
  return v_accepted_at;
end;
$$;
revoke all on function public.accept_community_terms(text) from public, anon;
grant execute on function public.accept_community_terms(text) to authenticated;

create or replace function public.sync_customer_cart(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_item jsonb; v_sku text; v_qty integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (
    select 1 from public.customer_memberships m
    where m.user_id = v_uid and m.status = 'active' and m.community_terms_accepted_at is not null
  ) then raise exception 'ACTIVE_COMMUNITY_MEMBERSHIP_REQUIRED'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_CART';
  end if;
  if jsonb_array_length(p_items) > 40 then
    raise exception 'INVALID_CART';
  end if;
  delete from public.customer_cart_items where user_id = v_uid;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_sku := upper(trim(coalesce(v_item->>'sku','')));
    begin v_qty := (v_item->>'quantity')::integer;
    exception when others then raise exception 'INVALID_CART_QUANTITY'; end;
    if v_sku !~ '^[A-Z0-9._-]{1,60}$' or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_CART_ITEM';
    end if;
    insert into public.customer_cart_items(user_id,sku,quantity,updated_at)
    values(v_uid,v_sku,v_qty,now())
    on conflict (user_id,sku) do update
      set quantity = public.customer_cart_items.quantity + excluded.quantity, updated_at = now();
  end loop;
end;
$$;
revoke all on function public.sync_customer_cart(jsonb) from public, anon;
grant execute on function public.sync_customer_cart(jsonb) to authenticated;

drop policy if exists member_points_read_own_or_admin on public.member_point_transactions;
create policy member_points_read_own_or_admin on public.member_point_transactions
for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists member_points_admin_manage on public.member_point_transactions;
create policy member_points_admin_manage on public.member_point_transactions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists wishlist_owner_manage on public.wishlist_items;
create policy wishlist_owner_manage on public.wishlist_items
for all to authenticated
using (user_id = auth.uid() and exists (select 1 from public.customer_memberships m where m.user_id = auth.uid() and m.status = 'active' and m.community_terms_accepted_at is not null))
with check (user_id = auth.uid() and exists (select 1 from public.customer_memberships m where m.user_id = auth.uid() and m.status = 'active' and m.community_terms_accepted_at is not null));

drop policy if exists member_announcements_read_active on public.member_announcements;
create policy member_announcements_read_active on public.member_announcements
for select to authenticated using (public.is_admin() or (active and exists (select 1 from public.customer_memberships m where m.user_id = auth.uid() and m.status = 'active' and m.community_terms_accepted_at is not null)));
drop policy if exists member_announcements_admin_manage on public.member_announcements;
create policy member_announcements_admin_manage on public.member_announcements
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Active public promotions are visible to everyone; member-only promotions require a signed-in member.
drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions
for select to anon, authenticated using (
  public.is_admin() or (active and (not member_only or exists (
    select 1 from public.customer_memberships m where m.user_id = auth.uid() and m.status = 'active' and m.community_terms_accepted_at is not null
  )))
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists membership_announcements_active_idx on public.member_announcements(active, created_at desc);
create index if not exists point_transactions_user_created_idx on public.member_point_transactions(user_id, created_at desc);

-- Owner bootstrap: after the owner's account has been registered and email verified,
-- use the Supabase SQL editor (as project owner) to grant the admin role to that exact UUID.
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<OWNER_AUTH_USER_UUID>';
-- Never expose a public admin-registration form or let a customer change their own role.

-- Initial categories for the owner-operated single-store catalog.
insert into public.categories (slug, name, description, sort_order, active) values
 ('sublimation', jsonb_build_object('fr','Sublimation','ht','Sublimasyon','en','Sublimation','es','Sublimación'), '{}'::jsonb, 10, true),
 ('equipment', jsonb_build_object('fr','Équipements','ht','Ekipman','en','Equipment','es','Equipos'), '{}'::jsonb, 20, true),
 ('printing', jsonb_build_object('fr','Impressions','ht','Enpresyon','en','Printing','es','Impresión'), '{}'::jsonb, 30, true),
 ('embroidery', jsonb_build_object('fr','Broderie','ht','Bòde','en','Embroidery','es','Bordado'), '{}'::jsonb, 40, true),
 ('consumables', jsonb_build_object('fr','Consommables','ht','Konsomab','en','Consumables','es','Consumibles'), '{}'::jsonb, 50, true),
 ('textile', jsonb_build_object('fr','Textiles','ht','Tekstil','en','Textiles','es','Textiles'), '{}'::jsonb, 60, true),
 ('promotion', jsonb_build_object('fr','Articles promotionnels','ht','Atik pwomosyon','en','Promotional products','es','Artículos promocionales'), '{}'::jsonb, 70, true)
on conflict (slug) do nothing;

-- Idempotency token avoids creating duplicate orders on accidental double-click/retry.
alter table public.orders add column if not exists checkout_token uuid;
create unique index if not exists orders_user_checkout_token_unique
  on public.orders(user_id, checkout_token) where checkout_token is not null;

-- Secure checkout: prices, active status and stock are read/locked on the database,
-- never trusted from the browser. Only an authenticated customer can call this RPC.
create or replace function public.create_order_from_cart(
  p_items jsonb,
  p_checkout_token uuid,
  p_customer_phone text default null,
  p_customer_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_profile record;
  v_item jsonb;
  v_product record;
  v_sku text;
  v_qty integer;
  v_phone text;
  v_subtotal numeric(12,2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_existing record;
  v_currency char(3) := 'USD';
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if not exists (
    select 1 from public.customer_memberships m
    where m.user_id = v_uid and m.status = 'active' and m.community_terms_accepted_at is not null
  ) then
    raise exception 'ACTIVE_MEMBERSHIP_REQUIRED';
  end if;
  if p_checkout_token is null then
    raise exception 'CHECKOUT_TOKEN_REQUIRED';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_CART';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 40 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  select order_number, grand_total, currency
    into v_existing
    from public.orders
   where user_id = v_uid and checkout_token = p_checkout_token;
  if found then
    return jsonb_build_object('order_number', v_existing.order_number, 'total', v_existing.grand_total, 'currency', v_existing.currency, 'already_created', true);
  end if;

  select full_name, phone into v_profile from public.profiles where id = v_uid;
  v_phone := nullif(trim(coalesce(p_customer_phone, v_profile.phone)), '');
  if v_phone is null then
    raise exception 'CUSTOMER_PHONE_REQUIRED';
  end if;

  -- Lock products in deterministic SKU order to avoid inconsistent stock updates.
  for v_item in
    select value from jsonb_array_elements(p_items)
    order by value->>'sku'
  loop
    v_sku := upper(trim(coalesce(v_item->>'sku','')));
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_sku = '' or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_CART_ITEM';
    end if;
    select p.id, p.sku, coalesce(p.name->>'fr', p.sku) as product_name,
           p.price, p.currency, p.stock_quantity, p.track_inventory, p.price_status
      into v_product
      from public.products p
     where p.sku = v_sku and p.is_active = true
     for update;
    if not found then
      raise exception 'PRODUCT_NOT_AVAILABLE: %', v_sku;
    end if;
    if v_product.price is null or v_product.price_status <> 'active' then
      raise exception 'PRODUCT_PRICE_NOT_CONFIRMED: %', v_sku;
    end if;
    if v_product.currency <> v_currency then
      raise exception 'MIXED_CURRENCIES_NOT_SUPPORTED';
    end if;
    if v_product.track_inventory and v_product.stock_quantity < v_qty then
      raise exception 'INSUFFICIENT_STOCK: %', v_sku;
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  v_order_id := gen_random_uuid();
  v_order_number := 'IMC-' || to_char(now() at time zone 'UTC','YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8));

  insert into public.orders (
    id, order_number, checkout_token, user_id, customer_name, customer_email,
    customer_phone, status, payment_status, currency, subtotal, delivery_fee,
    discount_total, grand_total, customer_note
  ) values (
    v_order_id, v_order_number, p_checkout_token, v_uid,
    coalesce(nullif(v_profile.full_name,''), auth.jwt()->>'email', 'Client Imagie'),
    auth.jwt()->>'email', v_phone, 'received', 'unpaid', v_currency,
    v_subtotal, 0, 0, v_subtotal, nullif(trim(coalesce(p_customer_note,'')), '')
  );

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_sku := upper(trim(v_item->>'sku'));
    v_qty := (v_item->>'quantity')::integer;
    select p.id, p.sku, coalesce(p.name->>'fr', p.sku) as product_name,
           p.price, p.currency, p.stock_quantity, p.track_inventory
      into v_product
      from public.products p
     where p.sku = v_sku and p.is_active = true
     for update;
    insert into public.order_items (order_id, product_id, sku_snapshot, name_snapshot, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.sku, v_product.product_name, v_product.price, v_qty, v_product.price * v_qty);
    if v_product.track_inventory then
      update public.products set stock_quantity = stock_quantity - v_qty, updated_at = now() where id = v_product.id;
    end if;
  end loop;

  return jsonb_build_object('order_number', v_order_number, 'total', v_subtotal, 'currency', v_currency, 'already_created', false);
end;
$$;

revoke all on function public.create_order_from_cart(jsonb, uuid, text, text) from public;
grant execute on function public.create_order_from_cart(jsonb, uuid, text, text) to authenticated;


-- GRANTS EXPLICITES — les politiques RLS ci-dessus restent la barrière d'autorisation.
grant usage on schema public to anon, authenticated;

-- Catalogue public en lecture seule; écritures réservées à un administrateur RLS.
grant select on public.categories, public.products, public.product_images, public.product_variants to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.product_variants to authenticated;

-- Données clients: lecture limitée par RLS, opérations sensibles réservées au propriétaire.
grant select on public.profiles to authenticated;
grant update (full_name, phone, preferred_language) on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant update on public.orders to authenticated;
grant select, insert, update on public.quote_requests to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select on public.promotions to anon, authenticated;
grant insert, update, delete on public.promotions to authenticated;
grant select, insert, update, delete on public.audit_logs to authenticated;

-- Communauté: les clients lisent leurs propres données; les écritures d'administration sont filtrées par RLS.
grant select, update on public.customer_memberships to authenticated;
grant select on public.customer_cart_items to authenticated;
grant select, insert, update, delete on public.member_point_transactions to authenticated;
grant select, insert, update, delete on public.wishlist_items to authenticated;
grant select, insert, update, delete on public.member_announcements to authenticated;

-- Les visiteurs anonymes n'ont aucun privilège sur les tables contenant des comptes, commandes, devis ou paiements.
revoke all on public.profiles, public.addresses, public.orders, public.order_items, public.quote_requests, public.payments, public.audit_logs, public.customer_memberships, public.customer_cart_items, public.member_point_transactions, public.wishlist_items, public.member_announcements from anon;
