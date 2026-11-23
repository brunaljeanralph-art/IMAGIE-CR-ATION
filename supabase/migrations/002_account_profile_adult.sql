-- 002 — Champs de profil (prénom, nom, date de naissance) + majorité 18 ans vérifiée CÔTÉ SERVEUR.
-- À exécuter UNE FOIS dans Supabase → SQL Editor, APRÈS schema.sql. Idempotent.
-- NON EXÉCUTÉ DANS CETTE SESSION (pas de PostgreSQL disponible) : à tester sur votre projet (voir docs/ACCOUNTS_AND_GUEST_PURCHASE.md).
-- Confidentialité : birth_date n'est lisible que par le titulaire et l'admin (RLS existante sur public.profiles).

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists birth_date date;

-- 1) Règle de majorité + verrouillage de la date de naissance une fois enregistrée.
create or replace function public.enforce_profile_adult()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.birth_date is not null then
    if new.birth_date < date '1900-01-01'
       or new.birth_date > (current_date - interval '18 years')::date then
      raise exception 'ADULT_REQUIRED';
    end if;
  end if;
  if tg_op = 'UPDATE'
     and old.birth_date is not null
     and new.birth_date is distinct from old.birth_date
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'BIRTH_DATE_LOCKED';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_adult on public.profiles;
create trigger profiles_enforce_adult
before insert or update on public.profiles
for each row execute procedure public.enforce_profile_adult();

-- 2) Création du profil à l'inscription : copie prudente des métadonnées (jamais le rôle, jamais le consentement).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_birth date;
  v_first text := nullif(left(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), 60), '');
  v_last  text := nullif(left(trim(coalesce(new.raw_user_meta_data->>'last_name',  '')), 60), '');
begin
  begin
    v_birth := nullif(new.raw_user_meta_data->>'birth_date', '')::date;
  exception when others then
    v_birth := null;           -- valeur invalide : ignorée (profil à compléter)
  end;
  insert into public.profiles (id, full_name, first_name, last_name, email, phone, preferred_language, role, birth_date)
  values (
    new.id,
    coalesce(nullif(trim(coalesce(v_first, '') || ' ' || coalesce(v_last, '')), ''),
             new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    v_first, v_last,
    new.email,
    nullif(left(new.raw_user_meta_data->>'phone', 30), ''),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'fr'),
    'customer',
    v_birth                    -- si < 18 ans : le trigger ci-dessus refuse l'inscription (ADULT_REQUIRED)
  )
  on conflict (id) do nothing;
  insert into public.customer_memberships (user_id)
  values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

-- 3) Compléter le profil (connexion Google/Facebook/X ou ancien compte). Validation serveur.
create or replace function public.complete_member_profile(
  p_first_name text, p_last_name text, p_birth_date date, p_phone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_first text := trim(coalesce(p_first_name, '')); v_last text := trim(coalesce(p_last_name, '')); v_phone text := trim(coalesce(p_phone, ''));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if length(v_first) not between 1 and 60 or length(v_last) not between 1 and 60 then raise exception 'INVALID_NAME'; end if;
  if v_phone !~ '^\+?[0-9 ()\-.]{8,20}$' then raise exception 'INVALID_PHONE'; end if;
  if p_birth_date is null or p_birth_date < date '1900-01-01'
     or p_birth_date > (current_date - interval '18 years')::date then raise exception 'ADULT_REQUIRED'; end if;
  update public.profiles
     set first_name = v_first, last_name = v_last, full_name = v_first || ' ' || v_last,
         phone = v_phone, birth_date = coalesce(birth_date, p_birth_date)
   where id = auth.uid();
end;
$$;
revoke all on function public.complete_member_profile(text, text, date, text) from public, anon;
grant execute on function public.complete_member_profile(text, text, date, text) to authenticated;

-- 4) Adhésion à la communauté impossible sans profil complet (donc sans date de naissance ≥ 18 ans).
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
  if not exists (select 1 from public.profiles where id = auth.uid() and birth_date is not null) then
    raise exception 'PROFILE_INCOMPLETE';
  end if;
  update public.customer_memberships
     set community_terms_accepted_at = now(), community_terms_version = trim(p_version)
   where user_id = auth.uid() and status = 'active'
   returning community_terms_accepted_at into v_accepted_at;
  if v_accepted_at is null then raise exception 'ACTIVE_MEMBERSHIP_REQUIRED'; end if;
  return v_accepted_at;
end;
$$;
