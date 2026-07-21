# Ethiopian-canon source texts (all public domain)

| File | Contents | Source | Licence | Quality |
|---|---|---|---|---|
| `web_us/` (83 USFM files) | World English Bible **incl. full deuterocanon**: Tobit, Judith, Greek Esther, Wisdom, Sirach, Baruch, 1–2 Maccabees, 1 Esdras, Prayer of Manasseh, **Psalm 151**, 3 Maccabees, **2 Esdras / 4 Ezra**, 4 Maccabees, Greek Daniel + all 66 | ebible.org `eng-web` | Public domain | Clean USFM, verse-tagged — parse directly |
| `eng-web_usfm.zip` | original archive of the above | ebible.org | Public domain | — |
| `enoch_charles.txt` | **1 Enoch (Henok)**, R.H. Charles 1917 | Project Gutenberg #77935 | Public domain | Clean plain text; strip PG header/footer |
| `jubilees_charles_1902.txt` | **Jubilees (Kufale)**, R.H. Charles 1902 | archive.org `cu31924060029984` | No known US copyright | **OCR** — needs cleanup before ingest |

## Second batch (formerly "missing")

| File | Contents | Source | Licence | Quality |
|---|---|---|---|---|
| `meqabyan1_wikisource.wiki` | **1 Meqabyan** — ⚠ chapters 1–7 of ~36 only (translation in progress) | en.wikisource.org `Translation:1 Meqabyan` | CC BY-SA 4.0 (attribution + share-alike required) | Verse-numbered wikitext; flagged `{{delete}}` for WS:T scope policy (not copyright) — archived copy kept here |
| `meqabyan2_wikisource.wiki` | **2 Meqabyan** — all 21 chapters | en.wikisource.org `Translation:2 Meqabyan` | CC BY-SA 4.0 | Verse-numbered wikitext, same `{{delete}}` caveat |
| `meqabyan3_wikisource.wiki` | **3 Meqabyan** — all 10 chapters | en.wikisource.org `Translation:3 Meqabyan` | CC BY-SA 4.0 | Verse-numbered wikitext, same `{{delete}}` caveat |
| `sinodos_horner_1904.txt` | **Sinodos** — Horner, *The Statutes of the Apostles* (1904), Ethiopic text + English translation | archive.org `statutesapostle00unkngoog` | Public domain | Google-scan OCR, rough; English portions need extraction |
| `didascalia_harden_1920.txt` | **Ethiopic Didascalia** — Harden 1920 | archive.org `cu31924096083336` | Public domain | OCR, moderate cleanup needed |

## Third batch — Books of the Covenant + partial Clement

| File | Contents | Source | Licence | Quality |
|---|---|---|---|---|
| `kidan_cooper_maclean_1902.txt` | **Book of the Covenant 1** — Cooper & Maclean, *The Testament of Our Lord* (1902). ⚠ Translated from the **Syriac** Testamentum Domini, not the Ge'ez Kidan — same work, different recension; note this in `source_notes`. | archive.org `cu31924029296170` | Public domain | OCR, moderate cleanup |
| `apocryphal_nt_james_1924.txt` | M.R. James, *The Apocryphal New Testament* (1924). Contains the **Epistle of the Apostles** ("Testament of Our Lord in Galilee" = Book of the Covenant 2) and the **Ethiopic Apocalypse of Peter** (a core part of Qälëmentos/Clement). | archive.org `apocryphalnewtes0000mont` | PD in the US (pub. 1924) | OCR; extract just the needed sections |

Precedent: bible.ertale.com assembles its Ethiopian canon from exactly these
sources (Cooper & Maclean for Covenant 1, James 1924 for Covenant 2 and
Clement pt. 2, Horner for Sinodos Te'ezaz, Harden for Didascalia, Wikisource
CC BY-SA for Meqabyan) — confirms this sourcing map is the accepted one.

## Fourth batch — complete Meqabyan + Clement/Sinodos parallels

| File | Contents | Source | Licence | Quality |
|---|---|---|---|---|
| `meqabyan1_abbaselama.html` | **1 Meqabyan — COMPLETE, all 36 chapters** | Wayback Machine, members.aol.com/abaselama (linked as a free resource by the EOTC Bible Project) | ⚠ Freely distributed, no explicit licence — Iyaric/Rastafari-style English; verify/credit before publishing | Verse-numbered HTML; idiosyncratic dialect ("him would boast ina him horses abundance") |
| `meqabyan2_abbaselama.html` | **2 Meqabyan** — all 21 chapters (same translation family) | Wayback Machine, same site | Same caveat | Same style |
| `meqabyan3_abbaselama.html` | **3 Meqabyan** — all 10 chapters | Wayback Machine, same site | Same caveat | Same style |
| `apocrypha_arabica_gibson_1901.txt` | Gibson, *Apocrypha Arabica* (1901): **Book of the Rolls (Kitab al-Magall)** — the Arabic recension of the pseudo-Clementine "revelations of Peter to Clement", closest PD parallel to **Qälëmentos** | archive.org `apocryphaarabica00gibsuoft` | Public domain | OCR; English translation section extractable |
| `anf07_apostolic_constitutions.txt` | ANF vol. 7: **Constitutions of the Holy Apostles** — the Greek recension the **Sinodos** material substantially parallels | archive.org `antenicenefather07robe` | Public domain | OCR; extract Constitutions section (TOC p. 385) |

**Meqabyan strategy:** the Wikisource CC BY-SA text (readable modern English)
covers 1 Meqabyan ch. 1–7 and all of 2–3 Meqabyan; the Abba Selama Iyaric text
fills 1 Meqabyan ch. 8–36. Either present the dialect as-is with provenance,
or use it as a placeholder until Wikisource finishes / a licence is bought.

## Remaining true gaps (nothing free exists anywhere — verified)

- **1 Meqabyan ch. 8–36 in standard modern English** — only paid translations
  (D.P. Curtin 2018, ~$10–15; Feqade Selassie). The Iyaric text above covers the
  content; the Wikisource translation may eventually catch up.
- **Ethiopic Clement (Qälëmentos) direct-from-Ge'ez, books 1 & 3–7** — only the
  paid EOTC Bible Project edition. PD coverage is via parallels: James 1924
  (Ethiopic Apocalypse of Peter) + Gibson 1901 (Book of the Rolls).
- **Sinodos subsections beyond Horner** — no English anywhere except the paid
  EOTC edition; ANF vol. 7 gives the parallel Greek recension.

For these, seed with `Paragraph.is_placeholder = True` (or the parallel text,
clearly labelled as a different recension) and record it in
`Edition.source_notes` / `license_note`.

**CC BY-SA note:** mixing CC BY-SA (Meqabyan) with PD texts is fine, but the
Meqabyan pages must credit Wikisource contributors and carry the CC BY-SA
licence note in `Edition.license_note`; share-alike applies to derivatives of
those texts. The Wikisource user translations are amateur, largely unreviewed —
present with `Edition.source_notes` honesty.

Options for gaps: license a modern translation, or seed them with
`Paragraph.is_placeholder = True` and record the gap in
`Edition.source_notes` / `license_note`.

## Ingest notes

- USFM maps cleanly to the existing schema: book → `Chapter` (or `Book`),
  USFM `\c` → `Section`, USFM `\v` → `Paragraph`.
- `00-FRT*` is front matter and `106-GLO*` is the glossary — skip or treat
  as editorial, not scripture.
- Keep per-book provenance in `Edition.source_notes` so the mixed sourcing
  stays visible in the UI, as the Kybalion edition already does.
