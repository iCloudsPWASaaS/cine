-- Cinewood seed data: categories, genres, settings and four legal demo films
-- (Blender Foundation open movies, CC BY 3.0) so the player is usable out of the box.

insert into cinewood.categories (name, slug, description, sort_order, is_active, image_url) values
  ('Latest Movies', 'latest-movies', 'Freshly added titles on Cinewood.', 10, true, null),
  ('Trending', 'trending', 'What everyone is watching right now.', 20, true, null),
  ('Animation', 'animation', 'Hand-drawn, CG and everything in between.', 30, true, null),
  ('Sci-Fi', 'sci-fi', 'Far futures, strange worlds and big ideas.', 40, true, null),
  ('Family', 'family', 'Films for the whole household.', 50, true, null),
  ('Action', 'action', 'High stakes, fast cuts, big set pieces.', 60, true, null),
  ('Drama', 'drama', 'Stories that stay with you.', 70, true, null),
  ('Series', 'series', 'Episodic storytelling, season by season.', 80, true, null),
  ('Indonesian Movies', 'indonesian-movies', 'Indonesian cinema — chilling horror, action and heartfelt drama.', 90, true, '/categories/indonesian.svg'),
  ('Chinese Movies', 'chinese-movies', 'Mainland, Hong Kong and Taiwanese favourites in one place.', 100, true, '/categories/chinese.svg'),
  ('Bangla Movies', 'bangla-movies', 'Bengali stories from Dhaka to Kolkata, films and web series.', 110, true, '/categories/bangla.svg'),
  ('Bollywood Movies', 'bollywood-movies', 'Hindi cinema’s biggest stars, songs and spectacles.', 120, true, '/categories/bollywood.svg'),
  ('South Indian Movies', 'south-indian-movies', 'Telugu, Tamil, Malayalam and Kannada blockbusters.', 130, true, '/categories/south-indian.svg')
on conflict (slug) do nothing;

insert into cinewood.genres (tmdb_id, name, slug) values
  (28, 'Action', 'action'),
  (12, 'Adventure', 'adventure'),
  (16, 'Animation', 'animation'),
  (35, 'Comedy', 'comedy'),
  (80, 'Crime', 'crime'),
  (99, 'Documentary', 'documentary'),
  (18, 'Drama', 'drama'),
  (10751, 'Family', 'family'),
  (14, 'Fantasy', 'fantasy'),
  (36, 'History', 'history'),
  (27, 'Horror', 'horror'),
  (10402, 'Music', 'music'),
  (9648, 'Mystery', 'mystery'),
  (10749, 'Romance', 'romance'),
  (878, 'Science Fiction', 'science-fiction'),
  (10770, 'TV Movie', 'tv-movie'),
  (53, 'Thriller', 'thriller'),
  (10752, 'War', 'war'),
  (37, 'Western', 'western'),
  (10759, 'Action & Adventure', 'action-adventure'),
  (10762, 'Kids', 'kids'),
  (10763, 'News', 'news'),
  (10764, 'Reality', 'reality'),
  (10765, 'Sci-Fi & Fantasy', 'sci-fi-fantasy'),
  (10766, 'Soap', 'soap'),
  (10767, 'Talk', 'talk'),
  (10768, 'War & Politics', 'war-politics')
on conflict (slug) do nothing;

insert into cinewood.sources (name, slug, type, base_url, region, is_active, notes) values
  ('111Movies', 'movies111', 'embed', 'https://111movies.net', null, true,
   'Top-priority 1080p multi-server embed gateway.'),
  ('VidSrc.Mov', 'vidsrcmov', 'embed', 'https://vidsrc.mov', null, true,
   'Top-priority 1080p multi-server embed gateway.'),
  ('VidCore', 'vidcore', 'embed', 'https://vidcore.io', null, true,
   'Top-priority adaptive 4K embed gateway.'),
  ('VidZen', 'vidzen', 'embed', 'https://vidzen.fun', null, true,
   'Top-priority adaptive 4K embed gateway.'),
  ('StreamWish', 'streamwish', 'embed', 'https://streamwish.to/', null, true,
   'StreamWish embed provider (/e/ links).'),
  ('FileMoon', 'filemoon', 'embed', 'https://filemoon.sx/', null, true,
   'FileMoon HD embed provider (/e/ links).'),
  ('VidHide', 'vidhide', 'embed', 'https://vidhidepro.com/', null, true,
   'VidHide embed provider (/e/ links).'),
  ('DoodStream', 'doodstream', 'embed', 'https://doodstream.com/', null, true,
   'DoodStream embed provider (/e/ links).'),
  ('Open Cinema', 'open-cinema', 'mp4', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/', null, true,
   'Direct open-licence MP4 files for demo films.'),
  ('Adaptive HLS', 'adaptive-hls', 'hls', 'https://test-streams.mux.dev/', null, true,
   'Adaptive bitrate HLS demo stream.'),
  ('YouTube', 'youtube', 'youtube', 'https://www.youtube.com/', null, true,
   'Official trailers and feature content published by rights holders.'),
  ('JustWatch', 'justwatch', 'external', 'https://www.justwatch.com/', null, true,
   'Legal streaming availability links (rent, buy or subscribe).')
on conflict (slug) do nothing;

insert into cinewood.site_settings (key, value) values
  ('site', jsonb_build_object(
    'name', 'Cinewood',
    'tagline', 'Cinema, curated.',
    'description', 'A beautifully organised home for films and series. Built for people who love the movies.',
    'logo_text', 'CINEWOOD'
  )),
  ('player', jsonb_build_object('autoplay', false, 'default_quality', 'auto')),
  ('tmdb', jsonb_build_object('region', 'BD'))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Demo catalogue (public domain / CC BY open movies)
-- ---------------------------------------------------------------------------

insert into cinewood.movies (
  id, type, title, original_title, slug, tagline, overview, release_date, runtime,
  status, vote_average, vote_count, popularity, poster_url, backdrop_url,
  category_id, featured, trending, published, metadata
) values
  (
    '11111111-1111-4111-8111-111111111101', 'movie',
    'Big Buck Bunny', 'Big Buck Bunny', 'big-buck-bunny',
    'Big rabbit. Bigger heart. Very big revenge.',
    'A gentle giant of a rabbit has his day ruined by three bullying rodents. What follows is a masterclass in cartoon payback, brought to life by the Blender Foundation as one of the first open movies ever released.',
    '2008-04-10', 10, 'Released', 8.1, 5120, 96.4,
    '/demo/big-buck-bunny-poster.svg', '/demo/big-buck-bunny-backdrop.svg',
    (select id from cinewood.categories where slug = 'animation'),
    true, true, true,
    '{"demo":true,"license":"CC BY 3.0","studio":"Blender Foundation","country":"Netherlands"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111102', 'movie',
    'Sintel', 'Sintel', 'sintel',
    'A journey across a dying world to find a friend.',
    'A lone warrior named Sintel travels through snow, desert and ruin in search of the baby dragon she once nursed back to health. A short, heartbreaking fantasy epic from the Blender Foundation.',
    '2010-09-27', 15, 'Released', 8.6, 6840, 91.2,
    '/demo/sintel-poster.svg', '/demo/sintel-backdrop.svg',
    (select id from cinewood.categories where slug = 'animation'),
    true, true, true,
    '{"demo":true,"license":"CC BY 3.0","studio":"Blender Foundation","country":"Netherlands"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111103', 'movie',
    'Tears of Steel', 'Tears of Steel', 'tears-of-steel',
    'The future needs a hero from the past.',
    'In a damaged future Amsterdam, a group of scientists and warriors attempt to undo a robot uprising by reaching back into the memories of the man who caused it. Shot with real actors and open-source visual effects.',
    '2012-09-26', 12, 'Released', 7.4, 3910, 84.8,
    '/demo/tears-of-steel-poster.svg', '/demo/tears-of-steel-backdrop.svg',
    (select id from cinewood.categories where slug = 'sci-fi'),
    true, true, true,
    '{"demo":true,"license":"CC BY 3.0","studio":"Blender Foundation","country":"Netherlands"}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111104', 'movie',
    'Elephants Dream', 'Elephants Dream', 'elephants-dream',
    'Two strangers. One impossible machine.',
    'An older man and a younger companion wander a vast mechanical world that seems to reshape itself around them. The first open movie produced with Blender, and still one of its strangest.',
    '2006-03-24', 11, 'Released', 7.1, 2870, 71.6,
    '/demo/elephants-dream-poster.svg', '/demo/elephants-dream-backdrop.svg',
    (select id from cinewood.categories where slug = 'sci-fi'),
    false, true, true,
    '{"demo":true,"license":"CC BY 3.0","studio":"Blender Foundation","country":"Netherlands"}'::jsonb
  )
on conflict (slug) do nothing;

insert into cinewood.movie_genres (movie_id, genre_id)
select m.id, g.id
from (values
  ('big-buck-bunny', 'animation'),
  ('big-buck-bunny', 'family'),
  ('big-buck-bunny', 'comedy'),
  ('sintel', 'animation'),
  ('sintel', 'fantasy'),
  ('sintel', 'drama'),
  ('tears-of-steel', 'science-fiction'),
  ('tears-of-steel', 'drama'),
  ('elephants-dream', 'animation'),
  ('elephants-dream', 'science-fiction')
) as pairs(movie_slug, genre_slug)
join cinewood.movies m on m.slug = pairs.movie_slug
join cinewood.genres g on g.slug = pairs.genre_slug
on conflict do nothing;

insert into cinewood.movie_sources (movie_id, source_id, label, url, type, quality, language, priority, is_active)
select m.id, s.id, v.label, v.url, v.kind, v.quality, 'English', v.priority, true
from (values
  ('big-buck-bunny', 'open-cinema', 'Open Cinema • 1080p',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'mp4', '1080p', 20),
  ('big-buck-bunny', 'adaptive-hls', 'Adaptive HLS • Auto',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'hls', 'Auto', 10),
  ('sintel', 'open-cinema', 'Open Cinema • 1080p',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'mp4', '1080p', 20),
  ('tears-of-steel', 'open-cinema', 'Open Cinema • 1080p',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'mp4', '1080p', 20),
  ('elephants-dream', 'open-cinema', 'Open Cinema • 1080p',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'mp4', '1080p', 20)
) as v(movie_slug, source_slug, label, url, kind, quality, priority)
join cinewood.movies m on m.slug = v.movie_slug
join cinewood.sources s on s.slug = v.source_slug
on conflict (movie_id, url) do nothing;
