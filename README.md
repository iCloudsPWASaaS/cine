# Cinewood

A production-ready movie & series site with a full admin panel, Supabase backend, TMDB metadata import and an ArtPlayer-powered multi-source player.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase (`cinewood` schema) and ArtPlayer + hls.js.

## What is included

**Public site**
- Cinematic homepage with featured hero, trending, latest, top rated and category rows
- Browse movies / series with search, genre, category, year, type and sort filters
- Genre hub with title counts
- Watch pages with poster/backdrop art, cast, details, JustWatch availability and related titles
- Multi-source player: HLS adaptive streaming, MP4, iframe embeds, YouTube trailers and external provider links
- Responsive dark UI, SEO metadata, loading and 404 states

**Admin panel** (`/admin`)
- Supabase Auth email/password login, admin role check
- TMDB import by name: metadata, artwork, cast, genres, official trailer and JustWatch links
- Manual movie/series creation and editing
- Categories, genres and source registry CRUD
- Per-title playback source manager with priority, quality, language and active toggle
- Artwork upload to the Supabase Storage `cinewood` bucket
- Site settings, player defaults, metadata region and system status
- Admin REST API for TMDB search/import (session cookie or `ADMIN_API_KEY`)

## Quick start

```bash
npm install
npm run setup:db      # applies migrations + creates the cinewood bucket
npm run seed:admin    # creates the admin account from .env.local
npm run dev
```

Open http://localhost:3000

Admin: http://localhost:3000/admin

| | |
|---|---|
| Email | `admin@cinewood.local` |
| Password | `Cinewood#Admin2026` |

> Change the admin password after your first login. You can reset it any time with `npm run seed:admin`.

## Environment

Copy `.env.example` to `.env.local` and fill in the values. The repo already contains a working `.env.local` for this Supabase project.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_SCHEMA=cinewood
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=cinewood

ADMIN_EMAIL=admin@cinewood.local
ADMIN_PASSWORD="Cinewood#Admin2026"
ADMIN_API_KEY=<long-random-string>

TMDB_API_KEY=
# or TMDB_ACCESS_TOKEN= (v4 read token)
TMDB_REGION=BD
```

### TMDB (automatic metadata import)

1. Create a free account at https://www.themoviedb.org
2. Go to **Settings → API** and request an API key
3. Add `TMDB_API_KEY=your_key` (or a v4 `TMDB_ACCESS_TOKEN`) to `.env.local`
4. Restart the dev server

Without a TMDB key, manual entry and source management still work; the import panel shows setup instructions.

## Database

Migrations live in `supabase/migrations`:

- `0001_init.sql` — schema, tables, indexes, triggers, RLS, helper functions, schema exposure
- `0002_seed.sql` — categories, genres, site settings and four CC BY Blender open movies for testing playback

The app runs all database access server-side with the service role, so the public site and admin API remain protected. RLS policies are still provided for a future anon-key setup.

`npm run setup:db` uses the project's `exec_sql` helper through the Supabase REST API, then creates the public `cinewood` Storage bucket and verifies the schema. On a fresh project without `exec_sql`, paste the migration files into the Supabase SQL editor and create the bucket manually (public, 50 MB).

Storage bucket: `cinewood` (public; images up to 50 MB).

## Player & sources

Sources are stored per title in `cinewood.movie_sources`:

| Type | Behaviour |
|---|---|
| `hls` | `.m3u8` streams played by ArtPlayer + hls.js with adaptive quality |
| `mp4` | Direct video file |
| `embed` | Any licensed iframe/player embed |
| `youtube` | Official trailer or rights-holder video |
| `external` | Legal provider link (opens JustWatch/provider) |

Higher `priority` wins as the default source. Active sources are shown first. If a source stalls, viewers can switch sources without leaving the player.

## Legal note

Cinewood does **not** scrape or link piracy sites, and no code in this project searches for illegal streams. The automated import uses TMDB for factual metadata, official YouTube trailers and JustWatch availability links. Playback sources must be added by the administrator from content they are licensed to distribute.

The four demo films (Big Buck Bunny, Sintel, Tears of Steel, Elephants Dream) are Blender Foundation open movies licensed under CC BY 3.0 and are included so the player and UI can be tested immediately.

## Admin API

Send either an admin session cookie or:

```
Authorization: Bearer $ADMIN_API_KEY
```

**Search TMDB**

```http
GET /api/admin/tmdb/search?q=the+beast
```

**Import a title**

```http
POST /api/admin/tmdb/import
Content-Type: application/json

{ "tmdbId": 12345, "mediaType": "movie", "categoryId": "<optional-uuid>" }
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run setup:db` | Migrations + storage bucket |
| `npm run seed:admin` | Create/reset the admin account |

## Project structure

```
src/
  app/
    (site)/          Public pages, layout, player pages
    admin/           Login + protected dashboard route group
    api/             View tracking and admin TMDB endpoints
  components/site/   Header, hero, cards, rows, player
  components/admin/  Shell, forms, import panel, uploaders
  lib/               Supabase clients, queries, TMDB, import, auth
supabase/migrations/ SQL schema and seed data
scripts/             DB setup and admin bootstrap
public/demo/         Open-licence demo artwork
```

## Security

- The service role key is only used on the server.
- Admin actions verify both the Supabase session and the `admin` role.
- Admin API keys are compared server-side; keep `ADMIN_API_KEY` secret.
- `.env.local` is git-ignored.

> The credentials in the original request were shared in plain text. Rotate the Supabase service role key, secret key, publishable key and admin password before deploying publicly.
