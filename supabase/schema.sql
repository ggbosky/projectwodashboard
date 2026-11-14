-- Project Two CRM — databázové schéma pro Supabase.
-- Spusťte jednou v Supabase: SQL Editor → New query → vložit → Run.

-- 1) KDO SMÍ DOVNITŘ ---------------------------------------------------------
-- Registrovat se a číst data mohou jen e-maily z tohoto seznamu.
-- !!! Před spuštěním nahraďte svými třemi e-maily. !!!
create table public.allowed_emails (email text primary key);
insert into public.allowed_emails (email) values
  ('marek@example.com'),
  ('karel@example.com'),
  ('treti-clen@example.com');

-- 2) TÝM ---------------------------------------------------------------------
create table public.profiles (
  id text primary key,                       -- id přihlášeného uživatele, nebo slug AI agenta
  name text not null,
  role text not null default 'Člen týmu',
  color text not null default '#FF5A0F',
  ai boolean not null default false,
  created_at timestamptz not null default now()
);

-- AI agent bez vlastního přihlášení — člen týmu se na něj může v aplikaci přepnout.
insert into public.profiles (id, name, role, color, ai)
values ('claude', 'Claude', 'AI outreach agent', '#A78BFA', true);

-- 3) KLIENTI -----------------------------------------------------------------
create table public.clients (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  title text not null default '',
  company text not null,
  industry text not null default '',
  region text not null check (region in ('CZ', 'INTL')),
  country text not null default 'CZ',
  owner text references public.profiles (id) on delete set null,
  stage text not null check (stage in ('lead', 'messaged', 'proposal', 'meeting', 'won')),
  pkg text not null check (pkg in ('start', 'business', 'premium', 'webapp', 'custom')),
  value numeric not null default 0 check (value >= 0),
  currency text not null check (currency in ('CZK', 'EUR')),
  updated date not null default current_date,
  messages jsonb not null default '[]'::jsonb,
  notes text not null default '',
  linkedin text not null default '',
  created_at timestamptz not null default now()
);

-- 4) PŘÍSTUPOVÁ PRAVIDLA -----------------------------------------------------
create function public.is_team_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

alter table public.allowed_emails enable row level security;  -- bez pravidel = přes API nedostupné
alter table public.profiles enable row level security;
alter table public.clients enable row level security;

create policy "tym cte profily" on public.profiles
  for select to authenticated using (public.is_team_member());
create policy "clen upravuje svuj profil" on public.profiles
  for update to authenticated
  using (public.is_team_member() and id = auth.uid()::text)
  with check (id = auth.uid()::text);

create policy "tym spravuje klienty" on public.clients
  for all to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- 5) PROFIL PŘI REGISTRACI ---------------------------------------------------
-- Registrace s e-mailem mimo seznam se odmítne; ostatním se založí profil.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  palette text[] := array['#FF5A0F', '#38BDF8', '#34D399', '#FBBF24', '#F472B6'];
  n int;
begin
  if not exists (select 1 from public.allowed_emails where lower(email) = lower(new.email)) then
    raise exception 'Tento e-mail neni na seznamu tymu Project Two.';
  end if;
  select count(*) into n from public.profiles where not ai;
  insert into public.profiles (id, name, color)
  values (
    new.id::text,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    palette[1 + n % array_length(palette, 1)]
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) ŽIVÁ SYNCHRONIZACE ------------------------------------------------------
alter publication supabase_realtime add table public.clients, public.profiles;
