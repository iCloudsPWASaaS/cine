-- Upcoming titles and view-event reporting
-- Run with: npm run setup:db

alter table cinewood.movies
  add column if not exists upcoming boolean not null default false;

create index if not exists movies_upcoming_idx
  on cinewood.movies (upcoming) where upcoming = true;

-- Each view increments the counter on movies and records a timestamped event
-- so the reports page can show recent activity as well as lifetime totals.
create table if not exists cinewood.movie_view_events (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references cinewood.movies (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists movie_view_events_viewed_at_idx
  on cinewood.movie_view_events (viewed_at desc);

create index if not exists movie_view_events_movie_idx
  on cinewood.movie_view_events (movie_id, viewed_at desc);

alter table cinewood.movie_view_events enable row level security;

grant all on cinewood.movie_view_events to anon, authenticated, service_role;

create or replace function cinewood.increment_movie_views(movie_slug text)
returns void
language plpgsql
security definer
set search_path = cinewood, public
as $$
declare
  target_id uuid;
begin
  update cinewood.movies
  set view_count = view_count + 1
  where slug = movie_slug and published = true
  returning id into target_id;

  if target_id is not null then
    insert into cinewood.movie_view_events (movie_id) values (target_id);
  end if;
end;
$$;

grant execute on function cinewood.increment_movie_views(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
