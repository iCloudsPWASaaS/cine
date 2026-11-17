-- Cinewood core schema
-- Run with: npm run setup:db
-- or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create schema if not exists cinewood;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function cinewood.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function cinewood.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists cinewood.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cinewood.genres (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists cinewood.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  imdb_id text,
  type text not null default 'movie' check (type in ('movie', 'series')),
  title text not null,
  original_title text,
  slug text not null unique,
  tagline text,
  overview text,
  release_date date,
  runtime integer,
  status text,
  vote_average numeric(3, 1),
  vote_count integer,
  popularity numeric,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  category_id uuid references cinewood.categories (id) on delete set null,
  featured boolean not null default false,
  trending boolean not null default false,
  published boolean not null default true,
  view_count bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(original_title, '') || ' ' || coalesce(overview, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists movies_search_idx on cinewood.movies using gin (search_vector);
create index if not exists movies_category_idx on cinewood.movies (category_id);
create index if not exists movies_release_idx on cinewood.movies (release_date desc);
create index if not exists movies_created_idx on cinewood.movies (created_at desc);
create index if not exists movies_featured_idx on cinewood.movies (featured) where featured = true;
create index if not exists movies_trending_idx on cinewood.movies (trending) where trending = true;

create table if not exists cinewood.movie_genres (
  movie_id uuid not null references cinewood.movies (id) on delete cascade,
  genre_id uuid not null references cinewood.genres (id) on delete cascade,
  primary key (movie_id, genre_id)
);

create table if not exists cinewood.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null default 'embed' check (type in ('hls', 'mp4', 'embed', 'youtube', 'external')),
  base_url text,
  region text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cinewood.movie_sources (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references cinewood.movies (id) on delete cascade,
  source_id uuid references cinewood.sources (id) on delete set null,
  label text not null,
  url text not null,
  type text not null default 'embed' check (type in ('hls', 'mp4', 'embed', 'youtube', 'external')),
  quality text,
  language text,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (movie_id, url)
);

create index if not exists movie_sources_movie_idx on cinewood.movie_sources (movie_id);

create table if not exists cinewood.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cinewood.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists categories_touch on cinewood.categories;
create trigger categories_touch before update on cinewood.categories
for each row execute function cinewood.touch_updated_at();

drop trigger if exists movies_touch on cinewood.movies;
create trigger movies_touch before update on cinewood.movies
for each row execute function cinewood.touch_updated_at();

drop trigger if exists sources_touch on cinewood.sources;
create trigger sources_touch before update on cinewood.sources
for each row execute function cinewood.touch_updated_at();

drop trigger if exists movie_sources_touch on cinewood.movie_sources;
create trigger movie_sources_touch before update on cinewood.movie_sources
for each row execute function cinewood.touch_updated_at();

drop trigger if exists profiles_touch on cinewood.profiles;
create trigger profiles_touch before update on cinewood.profiles
for each row execute function cinewood.touch_updated_at();

drop trigger if exists site_settings_touch on cinewood.site_settings;
create trigger site_settings_touch before update on cinewood.site_settings
for each row execute function cinewood.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Admin helpers
-- ---------------------------------------------------------------------------

create or replace function cinewood.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = cinewood, public
as $$
  select exists (
    select 1 from cinewood.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

revoke all on function cinewood.is_admin(uuid) from public;
grant execute on function cinewood.is_admin(uuid) to authenticated, service_role;

create or replace function cinewood.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = cinewood, public
as $$
begin
  insert into cinewood.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists cinewood_on_auth_user_created on auth.users;
create trigger cinewood_on_auth_user_created
after insert on auth.users
for each row execute function cinewood.handle_new_user();

create or replace function cinewood.increment_movie_views(movie_slug text)
returns void
language sql
security definer
set search_path = cinewood, public
as $$
  update cinewood.movies
  set view_count = view_count + 1
  where slug = movie_slug and published = true;
$$;

grant execute on function cinewood.increment_movie_views(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table cinewood.categories enable row level security;
alter table cinewood.genres enable row level security;
alter table cinewood.movies enable row level security;
alter table cinewood.movie_genres enable row level security;
alter table cinewood.sources enable row level security;
alter table cinewood.movie_sources enable row level security;
alter table cinewood.profiles enable row level security;
alter table cinewood.site_settings enable row level security;

drop policy if exists "categories public read" on cinewood.categories;
create policy "categories public read" on cinewood.categories
  for select using (is_active = true);

drop policy if exists "categories admin write" on cinewood.categories;
create policy "categories admin write" on cinewood.categories
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "genres public read" on cinewood.genres;
create policy "genres public read" on cinewood.genres
  for select using (true);

drop policy if exists "genres admin write" on cinewood.genres;
create policy "genres admin write" on cinewood.genres
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "movies public read" on cinewood.movies;
create policy "movies public read" on cinewood.movies
  for select using (published = true);

drop policy if exists "movies admin write" on cinewood.movies;
create policy "movies admin write" on cinewood.movies
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "movie_genres public read" on cinewood.movie_genres;
create policy "movie_genres public read" on cinewood.movie_genres
  for select using (true);

drop policy if exists "movie_genres admin write" on cinewood.movie_genres;
create policy "movie_genres admin write" on cinewood.movie_genres
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "sources public read" on cinewood.sources;
create policy "sources public read" on cinewood.sources
  for select using (is_active = true);

drop policy if exists "sources admin write" on cinewood.sources;
create policy "sources admin write" on cinewood.sources
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "movie_sources public read" on cinewood.movie_sources;
create policy "movie_sources public read" on cinewood.movie_sources
  for select using (
    is_active = true
    and exists (
      select 1 from cinewood.movies m
      where m.id = movie_id and m.published = true
    )
  );

drop policy if exists "movie_sources admin write" on cinewood.movie_sources;
create policy "movie_sources admin write" on cinewood.movie_sources
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "profiles read own" on cinewood.profiles;
create policy "profiles read own" on cinewood.profiles
  for select using (auth.uid() = id or cinewood.is_admin(auth.uid()));

drop policy if exists "profiles update own" on cinewood.profiles;
create policy "profiles update own" on cinewood.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles admin write" on cinewood.profiles;
create policy "profiles admin write" on cinewood.profiles
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

drop policy if exists "site_settings public read" on cinewood.site_settings;
create policy "site_settings public read" on cinewood.site_settings
  for select using (true);

drop policy if exists "site_settings admin write" on cinewood.site_settings;
create policy "site_settings admin write" on cinewood.site_settings
  for all using (cinewood.is_admin(auth.uid()))
  with check (cinewood.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (the app uses the service role server-side, these keep anon reads
-- working if the schema is exposed to the public API).
-- ---------------------------------------------------------------------------

grant usage on schema cinewood to anon, authenticated, service_role;
grant all on all tables in schema cinewood to anon, authenticated, service_role;
grant all on all sequences in schema cinewood to anon, authenticated, service_role;
grant execute on all functions in schema cinewood to anon, authenticated, service_role;

alter default privileges in schema cinewood grant all on tables to anon, authenticated, service_role;
alter default privileges in schema cinewood grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema cinewood grant execute on functions to anon, authenticated, service_role;

-- Expose the schema to PostgREST. Harmless if it is already configured.
do $$
begin
  begin
    alter role authenticator set pgrst.db_schemas = 'public, storage, graphql_public, cinewood';
  exception when insufficient_privilege then
    null;
  end;
  begin
    alter database postgres set pgrst.db_schemas = 'public, storage, graphql_public, cinewood';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';

-- Remove the temporary diagnostics helper if an earlier setup created it.
drop function if exists public.cinewood_debug();
