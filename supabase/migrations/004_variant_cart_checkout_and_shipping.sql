-- IMAGIE CRÉATION — migration 004
-- Variant-aware member cart + server-validated order checkout + saved shipping address.
-- Run AFTER schema.sql and migrations 002 and 003.
-- Safe to re-run: columns/indexes/constraints are guarded and functions are replaced.

begin;

-- A member can keep two variants of the same product in the cart as separate lines.
alter table public.customer_cart_items
  add column if not exists selection_key text not null default '',
  add column if not exists selected_variant_id uuid,
  add column if not exists variant_snapshot jsonb not null default '{}'::jsonb;

alter table public.customer_cart_items
  drop constraint if exists customer_cart_items_pkey;
alter table public.customer_cart_items
  add constraint customer_cart_items_pkey primary key (user_id, sku, selection_key);

-- A deleted variant should not leave an invalid selected variant reference in old cart rows.
alter table public.customer_cart_items
  drop constraint if exists customer_cart_items_selected_variant_fk;
alter table public.customer_cart_items
  add constraint customer_cart_items_selected_variant_fk
  foreign key (selected_variant_id) references public.product_variants(id) on delete cascade;

create index if not exists customer_cart_items_user_updated_idx
  on public.customer_cart_items(user_id, updated_at desc);
create index if not exists product_variants_product_active_idx
  on public.product_variants(product_id, active);

-- Synchronize only the authenticated member's own cart. Variant identifiers are
-- checked against the product row on the server; browser-supplied prices are ignored.
create or replace function public.sync_customer_cart(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_sku text;
  v_qty integer;
  v_variant_key text;
  v_variant_id uuid;
  v_product_id uuid;
  v_variant record;
  v_snapshot jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (
    select 1 from public.customer_memberships m
    where m.user_id = v_uid and m.status = 'active' and m.community_terms_accepted_at is not null
  ) then raise exception 'ACTIVE_COMMUNITY_MEMBERSHIP_REQUIRED'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 40 then
    raise exception 'INVALID_CART';
  end if;

  delete from public.customer_cart_items where user_id = v_uid;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_sku := upper(trim(coalesce(v_item->>'sku','')));
    begin
      v_qty := (v_item->>'quantity')::integer;
      v_variant_key := trim(coalesce(v_item->>'variant_key',''));
      v_variant_id := case when v_variant_key = '' then null else v_variant_key::uuid end;
    exception when others then
      raise exception 'INVALID_CART_ITEM';
    end;
    if v_sku !~ '^[A-Z0-9._-]{1,60}$' or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_CART_ITEM';
    end if;

    select id into v_product_id
      from public.products
     where sku = v_sku and is_active = true;
    if not found then raise exception 'PRODUCT_NOT_AVAILABLE: %', v_sku; end if;

    v_snapshot := '{}'::jsonb;
    if v_variant_id is not null then
      select id, sku, label, option_values, price_adjustment, stock_quantity, active
        into v_variant
        from public.product_variants
       where id = v_variant_id and product_id = v_product_id and active = true;
      if not found then raise exception 'VARIANT_NOT_AVAILABLE: %', v_sku; end if;
      v_snapshot := jsonb_build_object(
        'variant_id', v_variant.id,
        'sku', v_variant.sku,
        'label', v_variant.label,
        'option_values', v_variant.option_values,
        'price_adjustment', v_variant.price_adjustment
      );
    end if;

    insert into public.customer_cart_items(
      user_id, sku, quantity, selection_key, selected_variant_id, variant_snapshot, updated_at
    ) values (
      v_uid, v_sku, v_qty, coalesce(v_variant_id::text,''), v_variant_id, v_snapshot, now()
    )
    on conflict (user_id, sku, selection_key) do update
      set quantity = excluded.quantity,
          selected_variant_id = excluded.selected_variant_id,
          variant_snapshot = excluded.variant_snapshot,
          updated_at = now();
  end loop;
end;
$$;

revoke all on function public.sync_customer_cart(jsonb) from public, anon;
grant execute on function public.sync_customer_cart(jsonb) to authenticated;

-- Replace the old checkout overload so that a client cannot accidentally call a
-- weaker function that ignores selected variants or shipping address ownership.
drop function if exists public.create_order_from_cart(jsonb, uuid, text, text);

create or replace function public.create_order_from_cart(
  p_items jsonb,
  p_checkout_token uuid,
  p_customer_phone text default null,
  p_customer_note text default null,
  p_shipping_address_id uuid default null
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
  v_variant record;
  v_sku text;
  v_qty integer;
  v_variant_id uuid;
  v_phone text;
  v_unit_price numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_order_id uuid;
  v_order_number text;
  v_existing record;
  v_currency char(3) := 'USD';
  v_shipping_address jsonb := null;
  v_variant_snapshot jsonb;
  v_row_count integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (
    select 1 from public.customer_memberships m
    where m.user_id = v_uid and m.status = 'active' and m.community_terms_accepted_at is not null
  ) then raise exception 'ACTIVE_MEMBERSHIP_REQUIRED'; end if;
  if p_checkout_token is null then raise exception 'CHECKOUT_TOKEN_REQUIRED'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'INVALID_CART'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;
  if jsonb_array_length(p_items) > 40 then raise exception 'TOO_MANY_ITEMS'; end if;

  -- Keep checkout idempotent: a retry with the same token returns the first order.
  select order_number, grand_total, currency
    into v_existing
    from public.orders
   where user_id = v_uid and checkout_token = p_checkout_token;
  if found then
    return jsonb_build_object(
      'order_number', v_existing.order_number,
      'total', v_existing.grand_total,
      'currency', v_existing.currency,
      'already_created', true
    );
  end if;

  select full_name, phone into v_profile from public.profiles where id = v_uid;
  v_phone := nullif(trim(coalesce(p_customer_phone, v_profile.phone)), '');
  if v_phone is null then raise exception 'CUSTOMER_PHONE_REQUIRED'; end if;

  -- The address must belong to the connected customer. No address is accepted
  -- only when the customer and owner will confirm delivery / pickup separately.
  if p_shipping_address_id is not null then
    select to_jsonb(a) - 'user_id'
      into v_shipping_address
      from public.addresses a
     where a.id = p_shipping_address_id and a.user_id = v_uid;
    if not found then raise exception 'ADDRESS_NOT_FOUND'; end if;
  end if;

  -- First pass: lock each product/variant and compute the price from database values.
  for v_item in
    select jsonb_build_object(
      'sku', upper(trim(value->>'sku')),
      'quantity', sum((value->>'quantity')::integer),
      'variant_id', max(nullif(value->>'variant_id',''))
    )
    from jsonb_array_elements(p_items)
    group by upper(trim(value->>'sku')), nullif(value->>'variant_id','')
    order by upper(trim(value->>'sku')), coalesce(nullif(value->>'variant_id',''),'')
  loop
    v_sku := upper(trim(coalesce(v_item->>'sku','')));
    begin
      v_qty := coalesce((v_item->>'quantity')::integer, 0);
      v_variant_id := case when nullif(v_item->>'variant_id','') is null then null else (v_item->>'variant_id')::uuid end;
    exception when others then
      raise exception 'INVALID_CART_ITEM';
    end;
    if v_sku !~ '^[A-Z0-9._-]{1,60}$' or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_CART_ITEM';
    end if;

    select p.id, p.sku, coalesce(p.name->>'fr', p.sku) as product_name,
           p.price, p.currency, p.stock_quantity, p.track_inventory, p.price_status
      into v_product
      from public.products p
     where p.sku = v_sku and p.is_active = true
     for update;
    if not found then raise exception 'PRODUCT_NOT_AVAILABLE: %', v_sku; end if;
    if v_product.price is null or v_product.price_status <> 'active' then
      raise exception 'PRODUCT_PRICE_NOT_CONFIRMED: %', v_sku;
    end if;

    if exists (select 1 from public.product_variants pv where pv.product_id = v_product.id and pv.active = true)
       and v_variant_id is null then
      raise exception 'VARIANT_REQUIRED: %', v_sku;
    end if;

    v_unit_price := v_product.price;
    if v_variant_id is not null then
      select pv.id, pv.sku, pv.label, pv.option_values, pv.price_adjustment,
             pv.stock_quantity, pv.active
        into v_variant
        from public.product_variants pv
       where pv.id = v_variant_id and pv.product_id = v_product.id and pv.active = true
       for update;
      if not found then raise exception 'VARIANT_NOT_AVAILABLE: %', v_sku; end if;
      v_unit_price := v_product.price + coalesce(v_variant.price_adjustment,0);
      if v_product.track_inventory and v_variant.stock_quantity < v_qty then
        raise exception 'INSUFFICIENT_STOCK: %', v_sku;
      end if;
    elsif v_product.track_inventory and v_product.stock_quantity < v_qty then
      raise exception 'INSUFFICIENT_STOCK: %', v_sku;
    end if;

    if v_unit_price < 0 then raise exception 'INVALID_PRODUCT_PRICE: %', v_sku; end if;
    if v_product.currency <> v_currency then raise exception 'MIXED_CURRENCIES_NOT_SUPPORTED'; end if;
    v_subtotal := v_subtotal + (v_unit_price * v_qty);
  end loop;

  v_order_id := gen_random_uuid();
  v_order_number := 'IMC-' || to_char(now() at time zone 'UTC','YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,8));

  insert into public.orders (
    id, order_number, checkout_token, user_id, customer_name, customer_email,
    customer_phone, status, payment_status, currency, subtotal, delivery_fee,
    discount_total, grand_total, customer_note, shipping_address
  ) values (
    v_order_id, v_order_number, p_checkout_token, v_uid,
    coalesce(nullif(v_profile.full_name,''), auth.jwt()->>'email', 'Client Imagie'),
    auth.jwt()->>'email', v_phone, 'received', 'unpaid', v_currency,
    v_subtotal, 0, 0, v_subtotal, nullif(trim(coalesce(p_customer_note,'')), ''), v_shipping_address
  );

  -- Second pass: write immutable product/variant snapshots and reserve tracked stock.
  for v_item in
    select jsonb_build_object(
      'sku', upper(trim(value->>'sku')),
      'quantity', sum((value->>'quantity')::integer),
      'variant_id', max(nullif(value->>'variant_id',''))
    )
    from jsonb_array_elements(p_items)
    group by upper(trim(value->>'sku')), nullif(value->>'variant_id','')
    order by upper(trim(value->>'sku')), coalesce(nullif(value->>'variant_id',''),'')
  loop
    v_sku := upper(trim(v_item->>'sku'));
    v_qty := (v_item->>'quantity')::integer;
    v_variant_id := case when nullif(v_item->>'variant_id','') is null then null else (v_item->>'variant_id')::uuid end;

    select p.id, p.sku, coalesce(p.name->>'fr', p.sku) as product_name,
           p.price, p.currency, p.stock_quantity, p.track_inventory
      into v_product
      from public.products p
     where p.sku = v_sku and p.is_active = true
     for update;

    v_unit_price := v_product.price;
    v_variant_snapshot := '{}'::jsonb;
    if v_variant_id is not null then
      select pv.id, pv.sku, pv.label, pv.option_values, pv.price_adjustment,
             pv.stock_quantity, pv.active
        into v_variant
        from public.product_variants pv
       where pv.id = v_variant_id and pv.product_id = v_product.id and pv.active = true
       for update;
      v_unit_price := v_product.price + coalesce(v_variant.price_adjustment,0);
      v_variant_snapshot := jsonb_build_object(
        'variant_id', v_variant.id,
        'sku', v_variant.sku,
        'label', v_variant.label,
        'option_values', v_variant.option_values,
        'price_adjustment', v_variant.price_adjustment
      );
    end if;

    insert into public.order_items (
      order_id, product_id, sku_snapshot, name_snapshot, variant_snapshot,
      unit_price, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.sku, v_product.product_name, v_variant_snapshot,
      v_unit_price, v_qty, v_unit_price * v_qty
    );

    if v_product.track_inventory then
      if v_variant_id is not null then
        update public.product_variants
           set stock_quantity = stock_quantity - v_qty
         where id = v_variant_id and stock_quantity >= v_qty;
      else
        update public.products
           set stock_quantity = stock_quantity - v_qty, updated_at = now()
         where id = v_product.id and stock_quantity >= v_qty;
      end if;
      get diagnostics v_row_count = row_count;
      if v_row_count <> 1 then raise exception 'INSUFFICIENT_STOCK: %', v_sku; end if;
    end if;
  end loop;

  delete from public.customer_cart_items where user_id = v_uid;

  return jsonb_build_object(
    'order_number', v_order_number,
    'total', v_subtotal,
    'currency', v_currency,
    'already_created', false
  );
end;
$$;

revoke all on function public.create_order_from_cart(jsonb, uuid, text, text, uuid) from public, anon;
grant execute on function public.create_order_from_cart(jsonb, uuid, text, text, uuid) to authenticated;

-- If a browser enabled Push before the customer signed in, let the same signed-in
-- browser attach its existing endpoint to that member. Endpoints are unguessable;
-- an endpoint already attached to another account is never reassigned.
create or replace function public.claim_push_subscription(p_endpoint text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_endpoint is null or length(p_endpoint) < 20 or length(p_endpoint) > 2048 or p_endpoint not like 'https://%' then
    raise exception 'INVALID_PUSH_ENDPOINT';
  end if;
  update public.push_subscriptions
     set user_id = v_uid, updated_at = now()
   where endpoint = p_endpoint and user_id is null;
  return found;
end;
$$;
revoke all on function public.claim_push_subscription(text) from public, anon;
grant execute on function public.claim_push_subscription(text) to authenticated;

commit;
