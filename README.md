# The Perennial — A Living Library of Sacred Texts

A dark, atmospheric, production-grade web application — a growing library
of sacred and wisdom texts. It currently holds two books —
*The Kybalion* (Three Initiates, 1908) and *The Ethiopian Bible* (the
broader canon of the Ethiopian Orthodox Tewahedo Church, ninety books
assembled from public-domain and freely licensed English translations) —
switchable from the navigation rail, each with its own colour scheme
(tarnished gold on warm near-black for the Kybalion; moon-silver on indigo
night for the Bible), plus app-wide dark and light modes and a slow,
weighted scroll throughout.

> Kybalion text: the complete chapters I–XV of the public-domain 1908
> edition, loaded verbatim from the Project Gutenberg transcription
> (ebook #14209). Ethiopian Bible text: the World English Bible (OT, NT,
> and deuterocanon), R. H. Charles's 1 Enoch (1917), and free community
> translations of Meqabyan from the Ge'ez — full provenance in
> `sources/MANIFEST.md`; books with no free English text yet appear as
> clearly marked placeholders. All explanations, definitions, examples, and
> visualisations are modern editorial additions, always visibly separated
> from the original text. AI-generated commentary, where present, is
> explicitly labelled with its model and review status.
>
> Content pipeline: `python scripts/build_ethiopian_bible.py` regenerates
> `backend/library/data/ethiopian_bible.json` from `sources/`;
> `python manage.py seed_ethiopian_bible` loads it (the deploy runs both
> seed commands with `--if-empty`).

## Product concept

Read the book chapter by chapter in a calm, typographically serious reader.
Curated passages carry quiet dotted marks; opening one reveals layered
commentary — plain-English explanation, deeper interpretation, definitions,
historical context, modern and practical examples, common misunderstandings,
related passages, linked principles, and reflection questions. Around the
reader: a dedicated section for the seven Hermetic principles with an
interactive visualisation each, a force-directed knowledge map of the whole
book, full search, and personal study tools (bookmarks, highlights, notes,
journal, reading progress) that work locally for anonymous readers and sync
for account holders.

## Features

- **Reader** — 15 chapters, adjustable type/spacing/width, five themes
  (Midnight, Obsidian, Parchment, Deep Sepia, Low-Light Crimson), four
  reading modes (Clean, Guided, Study, Reflection), paragraph numbers,
  distraction-free mode, chapter navigation with completion state, progress
  tracking, prev/next navigation.
- **Annotations** — 14 annotation types with a tabbed panel (side panel on
  desktop, draggable bottom sheet on mobile); only sections with content
  render; editorial vs AI provenance always shown.
- **Seven Principles** — a page per principle: axiom with source, plain and
  deep readings, editorial notes (including careful modern framing of the
  Gender chapter), examples, misunderstandings, relationships, prompts,
  private notes, and a bespoke interactive visualisation each (SVG/Canvas,
  reduced-motion aware).
- **Knowledge map** — custom force layout of principles, chapters, and
  passages; pan/zoom/drag, filters, search, focus mode, shortest-path
  tracing, and an accessible list alternative.
- **Search** — grouped results across text, chapters, principles,
  commentary, definitions, and (signed in) notes, journal, highlights,
  bookmarks; debounced instant results, filters, exact-phrase mode, match
  highlighting, recent searches.
- **Study tools** — bookmarks (7 target kinds, duplicate-proof, toggle),
  highlights (4 restrained styles, anchored to text offsets so they survive
  layout changes, notes and tags), private notes with markdown-lite, and a
  journal with autosaving drafts, prompts, linking, favourites, filters, and
  JSON export.
- **Accounts** — JWT auth with rotating refresh tokens and blacklisting,
  profile management, full data export, account deletion, and merge of
  anonymous local progress on sign-up. Reading never requires an account.
- **Craft** — ambient dust-and-light background (pauses when hidden, thins
  on mobile, disabled by `prefers-reduced-motion` or a setting), line-drawn
  seal loading states, skeletons shaped like book text, editorial empty
  states, consistent restrained motion, skip links, focus management,
  keyboard-operable annotations.

## Technology

**Frontend** — React 18, Vite 5, JavaScript (JSX), React Router 6,
Tailwind CSS 3, Framer Motion, Zustand, TanStack Query 5, React Hook Form,
Zod, Lucide icons, self-hosted EB Garamond / Cormorant Garamond / Inter.
Tests: Vitest + React Testing Library.

**Backend** — Python 3.12, Django 5, Django REST Framework, SimpleJWT
(rotation + blacklist), django-filter, django-cors-headers, WhiteNoise,
PostgreSQL (SQLite fallback for instant local dev). Tests: Django test
runner (53 tests).

## Repository layout

```
kybalion/
  backend/
    config/            settings, urls, pagination, error envelope
    accounts/ library/ principles/ annotations/
    reading_progress/ bookmarks/ highlights/ notes/ journal/ search/
    common/            shared abstract model, permissions, test fixtures
    manage.py  requirements.txt  Dockerfile
  frontend/
    src/
      api/ app/ components/ hooks/ layouts/ pages/ stores/ styles/ utils/
    package.json  vite.config.js  tailwind.config.js  Dockerfile
  docs/
    ARCHITECTURE.md  CONTENT.md  DEPLOYMENT.md
  docker-compose.yml  .env.example  README.md
```

## Quick start

Prerequisites: Python 3.12+, Node 20+, (optional) PostgreSQL 14+ or Docker.

```bash
git clone <repository-url>
cd kybalion
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows (PowerShell: venv\Scripts\Activate.ps1)
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_content
python manage.py createsuperuser
python manage.py runserver
```

With no `DATABASE_NAME` configured this runs on a local SQLite file — zero
setup. To use PostgreSQL, copy `.env.example` to `backend/.env` and fill in
the `DATABASE_*` values, then re-run `migrate` and `seed_content`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The API base URL defaults to
`http://localhost:8000/api`; override it with `frontend/.env`
(`VITE_API_BASE_URL=...`).

### Docker (alternative)

```bash
docker compose up --build
```

This starts PostgreSQL, migrates, seeds, and serves the API on :8000 and the
frontend on :5173.

## Environment variables

See `.env.example` at the repository root. Backend:

```env
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_NAME=            # empty → SQLite fallback (dev only)
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_HOST=localhost
DATABASE_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Running tests

```bash
# Backend (53 tests: auth, ownership, content, search, progress, bookmarks…)
cd backend
python manage.py test

# Frontend (26 tests: segmentation, markdown safety, stores, reader, annotations)
cd frontend
npm test
```

## Production build

```bash
# Frontend
cd frontend && npm run build          # → frontend/dist/

# Backend
cd backend
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

Full guidance — hosts, HTTPS, cookies, CORS, checklist — in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Copyright and source text

The 1908 edition of *The Kybalion* is in the public domain. The complete
text of chapters I–XV ships in
`backend/library/data/kybalion_1908.json`, imported verbatim from the
Project Gutenberg transcription (ebook #14209) by
`backend/scripts/import_gutenberg.py` and loaded by `seed_content`. Curated
annotations anchor to the text by exact phrase search at seed time, so the
commentary layer can never silently drift from the text. Provenance,
update workflow, and the placeholder mechanism (used only if unverified
text is ever introduced) are documented in
[docs/CONTENT.md](docs/CONTENT.md).

## Accessibility

Semantic landmarks and heading order; skip link; visible focus states;
keyboard-operable passage marks, tabs, modals, and sheets with focus trap and
restore; ARIA labels on all icon controls; text alternatives for every
visualisation and for the knowledge map; AA-contrast reader themes;
`prefers-reduced-motion` honoured everywhere plus an in-app motion toggle;
44px-class touch targets and safe-area insets on mobile.

## Known limitations

- The publisher's front matter and the book's Introduction (a preface by
  the anonymous authors) are not included in the reader — only chapters
  I–XV. Adding the Introduction is a small content task (see
  docs/CONTENT.md).
- Password reset requires email delivery, which is not configured; the
  architecture (SimpleJWT + Django auth) supports adding it directly.
- AI explanations are represented by one clearly labelled mock annotation and
  full provenance modelling; no external AI API is called (by design for v1).
- Offline support is limited to TanStack Query caching and persisted local
  state; a service worker/PWA is a candidate next step.
- End-to-end (Playwright) tests are not included; backend + component test
  suites cover the critical flows.

## Roadmap

Semantic search over the existing search service seam · AI passage
explanations behind the annotation provenance model · audio narration and
ambient sound (architecture reserved, off by default) · community
annotations · reading groups · multiple texts · PWA/offline chapters.

## Screenshots

_Placeholder — add screenshots of the landing seal, reader with annotation
panel, a principle visualisation, and the knowledge map._
#   k y b a l i o n  
 