# Content guide — the source text and how to update it

The Kybalion (Three Initiates, Yogi Publication Society, Chicago, 1908) is in
the **public domain** in the United States.

## Current status

The complete reading text of **chapters I–XV is loaded verbatim** from the
Project Gutenberg transcription (ebook #14209,
https://www.gutenberg.org/ebooks/14209) of the 1908 edition.

| Content | Status |
| --- | --- |
| Chapters I–XV, all 270 paragraphs | Verbatim public-domain text (`is_placeholder=False`) |
| The publisher's front matter and the authors' Introduction | Not included in the reader |
| Explanations, definitions, examples, misunderstandings | Original editorial commentary written for this project (always shown as commentary) |
| One sample AI annotation | Clearly labelled `origin=ai`, model `local-mock`, unreviewed |

## How the text flows into the database

```
pg14209-images.html  ──(scripts/import_gutenberg.py)──▶  library/data/kybalion_1908.json
                                                              │
                              manage.py seed_content  ◀───────┘
                              ├─ chapters/sections/paragraphs (verbatim, kinds detected)
                              └─ curated passages anchored by exact phrase search
```

* `backend/scripts/import_gutenberg.py` parses the Gutenberg HTML: `<h3>`
  chapter markers, `<h5>` titles, quotation paragraphs (margin-styled or
  matching `"…"—The Kybalion.`), body paragraphs with line wraps collapsed.
  The text itself is never altered.
* `backend/library/data/kybalion_1908.json` is the canonical content
  artifact, committed to the repository with full provenance in its `source`
  block.
* `backend/library/seed_curation.py` holds the study layer: per-chapter
  editorial introductions/summaries (`CHAPTER_META`) and the curated
  annotated passages (`CURATED_PASSAGES`), each specified as a chapter
  number plus an **exact phrase**.
* `manage.py seed_content` rebuilds book content (never user data): it loads
  the JSON, then anchors every curated passage by case-insensitive phrase
  search within its chapter, storing verified character offsets and the
  actual matched text as the excerpt. **A phrase that cannot be found aborts
  the seed** — the annotation layer cannot silently drift from the text.

## Updating or replacing the text

1. Obtain the new source (e.g. a re-proofed transcription) and verify it
   against a scan of the 1908 printing.
2. Run `python scripts/import_gutenberg.py <file.html>` (or adapt the script
   for a different source format) to regenerate the JSON.
3. Update `EDITION["source_notes"]` in `library/seed_data.py` with the new
   provenance.
4. Run `python manage.py seed_content`. If any curated phrase no longer
   matches, the command names the passage and phrase — adjust
   `seed_curation.py` accordingly.

### Adding the Introduction

The authors' Introduction precedes Chapter I in the original. To include it:
extend `import_gutenberg.py` to start at the `INTRODUCTION` heading, add a
`CHAPTER_META` entry (e.g. `number: 0`, slug `introduction`), and teach the
frontend's `toRoman` helper to render number 0 as "Introduction".

## Rules that must survive any content change

* Never mix commentary into `Paragraph.text`. Commentary lives in
  `Annotation` rows with origin, attribution, and publishing status.
* Never present AI-generated text without its `ai_model` / `ai_reviewed`
  metadata.
* Do not invent quotations. If a passage cannot be verified, flag it
  `is_placeholder=True` — the UI badges it and this document must say so.
* Highlights anchor to paragraph character offsets. If paragraph text
  changes, existing user highlights on that paragraph may need re-anchoring;
  the highlight's captured `text` field exists to support that.
