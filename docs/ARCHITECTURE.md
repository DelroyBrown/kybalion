# Architecture

## Overview

Two clearly separated applications in one repository:

```
kybalion/
  backend/    Django 5 + DRF + SimpleJWT — content, users, private data
  frontend/   React 18 + Vite — the reading experience
  docs/       This documentation
```

The frontend talks to the backend exclusively through `/api/*` JSON endpoints.
Anonymous readers get the full text, principles, visualisations, and search;
authenticated readers additionally sync bookmarks, highlights, notes, journal
entries, reading progress, and preferences.

## Backend

### Apps

| App | Responsibility |
| --- | --- |
| `config` | Settings, root URLs, pagination, error envelope |
| `accounts` | Registration, JWT auth, profile, preferences, data export |
| `library` | Book → Edition → Chapter → Section → Paragraph → Passage |
| `principles` | The seven principles, relationships, examples, prompts, knowledge graph |
| `annotations` | Annotation types, annotations (editorial/AI), definitions, passage relationships, visualisation references |
| `reading_progress` | Per-chapter progress (upsert), reading sessions, merge of anonymous progress |
| `bookmarks` | Polymorphic-by-convention bookmarks (`kind` + `object_id`) with a toggle endpoint |
| `highlights` | Text highlights anchored to paragraph + character offsets |
| `notes` | Private notes attached to any location (`kind` + `object_id`) |
| `journal` | Reflection entries with optional passage/principle/chapter/prompt links |
| `search` | Grouped search service (PostgreSQL full-text with SQLite fallback), recent searches |

### Key decisions

* **Structurally addressable text.** Original text lives only in `Paragraph`
  rows. Curated `Passage` spans carry `start_offset`/`end_offset` validated
  against the paragraph text. Nothing is stored as one big HTML blob.
* **Commentary is never text.** `Annotation` rows carry `origin`
  (editorial/AI), `status` (draft/published/archived), attribution, and — for
  AI — model, prompt kind, generation date, and review status. Only published
  annotations are served.
* **Placeholder honesty.** `is_placeholder` flags on paragraphs and passages
  keep unverified text visibly provisional (see `docs/CONTENT.md`).
* **User-content addressing.** Bookmarks and notes use `kind` + `object_id`
  (slug or pk) with denormalised `chapter_slug`/`label` so lists render and
  deep-link without joins, and survive content republication.
* **Highlight anchoring.** Paragraph identity + character offsets (never
  pixel coordinates); the server snapshots the highlighted text at save time.
* **Progress is an upsert.** `POST /api/me/progress/` creates-or-updates per
  (user, chapter); furthest position and percent never regress. A `merge`
  action absorbs anonymous local progress after registration.
* **Ownership enforced twice.** Querysets filter by `request.user` *and*
  object permissions check `obj.user_id` — no insecure direct object refs.
* **Database portability.** PostgreSQL when `DATABASE_NAME` is set (with
  full-text search), SQLite fallback for instant local development (with
  `icontains` search). The search service is isolated in
  `search/services.py` so semantic/vector search can replace it later.
* **Error envelope.** All API errors share
  `{"error": {"code", "detail", "status"}}` via a custom exception handler.
* **Throttling.** Global anon/user rates plus scoped burst limits on auth
  endpoints and search.

### API surface (summary)

```
GET  /api/books/ /api/books/{slug}/ /api/books/{slug}/chapters/
GET  /api/chapters/ /api/chapters/{slug}/
GET  /api/passages/ /api/passages/{slug}/ /api/passages/{slug}/annotations/
GET  /api/principles/ /api/principles/{slug}/ /api/principles/graph/ /api/principles/prompts/
GET  /api/annotation-types/  /api/definitions/
GET  /api/search/?q=&types=&chapter=&principle=&exact=
GET/DELETE /api/search/recent/
POST /api/auth/register|token|token/refresh|logout/
GET/PATCH/DELETE /api/me/          GET /api/me/export/
GET/PUT /api/me/preferences/
GET/POST /api/me/progress/  POST /api/me/progress/merge/  GET /api/me/progress/summary/
CRUD /api/me/bookmarks/ (+ POST toggle/)  /api/me/highlights/  /api/me/notes/
CRUD /api/me/journal/ (+ GET export/)
```

## Frontend

### Structure

```
src/
  api/            fetch client (JWT + single-flight refresh) and TanStack Query hooks per domain
  app/            route table
  components/
    common/       Sigil, buttons, modal, bottom sheet, states, ambient background
    navigation/   desktop rail, mobile bottom bar + sheet
    reader/       paragraph rendering, controls, selection toolbar, chapter nav
    annotations/  annotation panel (side panel / bottom sheet) and content tabs
    principles/   original SVG symbols
    visualisations/ frame + seven lazy-loaded interactive figures
    map/          force layout engine
  hooks/          media queries, debounce, document title, progress tracker
  layouts/        AppLayout (skip link, nav, ambient, route transitions)
  pages/          one file per route
  stores/         zustand: auth (persisted), reader settings (persisted),
                  local anonymous progress (persisted), ephemeral UI
  styles/         Tailwind + reader theme CSS variables
  utils/          text segmentation, markdown-lite (React elements, no HTML
                  injection), accents, formatting, motion presets
```

### Key decisions

* **Server state vs UI state.** TanStack Query owns everything fetched;
  zustand owns reader settings, panels, and anonymous progress. Reader
  settings mirror the backend preference schema and sync for signed-in users.
* **Text segmentation.** `segmentText()` splits a paragraph by the boundary
  set of all curated passages and user highlights, so overlapping ranges
  render correctly; DOM spans carry `data-seg-start` so text selections map
  back to character offsets.
* **Reading modes** (clean / guided / study / reflection) are pure view
  state: they toggle marker visibility, paragraph numbers, the notes tab, and
  end-of-chapter prompts without refetching.
* **Reader themes** are CSS custom properties under `[data-reader-theme]` —
  five themes, all AA-contrast, including a light Parchment theme.
* **Knowledge map** uses a ~120-line custom force layout (repulsion +
  springs + centering) instead of a graph library; pan/zoom/drag are pointer
  events; a list alternative renders the same graph accessibly.
* **Motion discipline.** All animation goes through shared presets, and both
  `prefers-reduced-motion` and an in-app toggle disable ambient effects and
  visualisation motion.
* **Code splitting.** The knowledge map, principle detail page, and each of
  the seven visualisations are separate lazy chunks; fonts are self-hosted.
* **Safety.** User-authored content renders through a markdown-lite parser
  that emits React elements only — no `dangerouslySetInnerHTML` anywhere.
