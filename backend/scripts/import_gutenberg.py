"""
Convert the Project Gutenberg HTML edition of The Kybalion (ebook #14209)
into the canonical content file consumed by `manage.py seed_content`.

Usage:
    python scripts/import_gutenberg.py <path-to-pg14209-images.html>

Output:
    backend/library/data/kybalion_1908.json

The Gutenberg file marks chapters with <h3>CHAPTER N</h3> followed by an
<h5> title; Kybalion quotations are <p> elements carrying margin styling and
an em-dash "—The Kybalion." attribution. Body paragraphs are plain <p>
elements with hard line wraps that are collapsed to single spaces. The text
itself is preserved verbatim.
"""
import html as html_entities
import json
import re
import sys
from pathlib import Path

# A paragraph that is entirely a quotation with the book's own attribution,
# e.g. "THE ALL IS MIND; The Universe is Mental."—The Kybalion.
KYBALION_QUOTE = re.compile(r'^".*"—The Kybalion\.?$', re.S)

ROMAN_NUMBERS = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8,
    'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
}


def clean_text(fragment):
    text = re.sub(r'<[^>]+>', '', fragment)
    return re.sub(r'\s+', ' ', html_entities.unescape(text)).strip()


def parse(html):
    # The teaching text runs from the CHAPTER I marker to the PG footer;
    # the publisher's front matter and Introduction precede it.
    start = re.search(r'<h3[^>]*>\s*CHAPTER I\s*</h3>', html)
    end = html.find('<h2 id="pg-footer-heading"')
    if not start or end == -1:
        raise SystemExit('Unrecognised Gutenberg file layout — expected CHAPTER I <h3> and a PG footer.')
    body = html[start.start():end]

    chapters = []
    for tag, attrs, content in re.findall(r'<(h3|h5|p)\b([^>]*)>(.*?)</\1>', body, re.S):
        text = clean_text(content)
        if not text:
            continue
        if tag == 'h3':
            roman = text.replace('CHAPTER', '').strip()
            chapters.append({'number': ROMAN_NUMBERS[roman], 'source_title': None, 'paragraphs': []})
        elif tag == 'h5':
            if chapters and chapters[-1]['source_title'] is None:
                chapters[-1]['source_title'] = text
            elif text != 'FINIS':
                chapters[-1]['paragraphs'].append({'kind': 'body', 'text': text})
        elif tag == 'p' and chapters:
            is_quote = 'margin-left' in attrs or bool(KYBALION_QUOTE.match(text))
            kind = 'epigraph' if is_quote and not chapters[-1]['paragraphs'] else ('quote' if is_quote else 'body')
            chapters[-1]['paragraphs'].append({'kind': kind, 'text': text})

    # The book closes with FINIS; keep it as the final line of Chapter XV.
    chapters[-1]['paragraphs'].append({'kind': 'body', 'text': 'FINIS.'})
    return chapters


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source_path = Path(sys.argv[1])
    html = source_path.read_text(encoding='utf-8')
    chapters = parse(html)

    if len(chapters) != 15:
        raise SystemExit(f'Expected 15 chapters, parsed {len(chapters)} — aborting.')

    output = {
        'source': {
            'title': 'The Kybalion',
            'author_attribution': 'Three Initiates',
            'first_published': 1908,
            'publisher': 'Yogi Publication Society, Chicago',
            'transcription': 'Project Gutenberg ebook #14209',
            'url': 'https://www.gutenberg.org/ebooks/14209',
            'license': 'Public domain (published 1908, USA).',
            'imported_from': source_path.name,
        },
        'chapters': chapters,
    }

    destination = Path(__file__).resolve().parent.parent / 'library' / 'data' / 'kybalion_1908.json'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, indent=1, ensure_ascii=False), encoding='utf-8')

    total = sum(len(chapter['paragraphs']) for chapter in chapters)
    print(f'Wrote {destination} — 15 chapters, {total} paragraphs.')
    for chapter in chapters:
        print(f"  {chapter['number']:>2}. {chapter['source_title']} ({len(chapter['paragraphs'])} paragraphs)")


if __name__ == '__main__':
    main()
