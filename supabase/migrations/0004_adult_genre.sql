insert into cinewood.genres (tmdb_id, name, slug)
values (null, '18+', '18-plus')
on conflict (slug) do nothing;
