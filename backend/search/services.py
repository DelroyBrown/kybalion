"""
Search across original text, commentary, and (for authenticated users)
private content.

On PostgreSQL this uses full-text search; on SQLite it falls back to
case-insensitive containment so development works out of the box. The
service returns plain dicts grouped by result type, each with enough
location data to deep-link into the reader. Swapping in semantic /
vector search later only requires replacing the query functions here.
"""
from django.db import connection
from django.db.models import Q

from annotations.models import Annotation, Definition
from library.models import Chapter, Paragraph
from principles.models import Principle

SNIPPET_RADIUS = 90
MAX_PER_GROUP = 25


def _snippet(text, query):
    """A window of text around the first case-insensitive match."""
    lower_text, lower_query = text.lower(), query.lower()
    index = lower_text.find(lower_query)
    if index == -1:
        return text[: SNIPPET_RADIUS * 2] + ("…" if len(text) > SNIPPET_RADIUS * 2 else "")
    start = max(0, index - SNIPPET_RADIUS)
    end = min(len(text), index + len(query) + SNIPPET_RADIUS)
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    return f"{prefix}{text[start:end]}{suffix}"


def _text_filter(fields, query):
    """Q object matching `query` in any of `fields` (fallback strategy)."""
    q = Q()
    for field in fields:
        q |= Q(**{f"{field}__icontains": query})
    return q


def _postgres_rank(queryset, fields, query):
    from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

    vector = SearchVector(*fields)
    search_query = SearchQuery(query)
    return (
        queryset.annotate(rank=SearchRank(vector, search_query))
        .filter(rank__gt=0.001)
        .order_by("-rank")
    )


def _search(queryset, fields, query, exact=False):
    if exact or connection.vendor != "postgresql":
        return queryset.filter(_text_filter(fields, query))
    return _postgres_rank(queryset, fields, query)


def _chapter_of(paragraph):
    chapter = paragraph.section.chapter
    return {"slug": chapter.slug, "number": chapter.number, "title": chapter.title}


def search_public(query, *, book=None, chapter=None, principle=None, exact=False):
    results = {}

    paragraphs = Paragraph.objects.filter(section__chapter__is_published=True).select_related(
        "section__chapter"
    )
    if book:
        paragraphs = paragraphs.filter(section__chapter__book__slug=book)
    if chapter:
        paragraphs = paragraphs.filter(section__chapter__slug=chapter)
    if principle:
        paragraphs = paragraphs.filter(passages__principles__slug=principle).distinct()
    results["passages"] = [
        {
            "type": "passage",
            "paragraph_id": p.id,
            "paragraph_order": p.order,
            "chapter": _chapter_of(p),
            "snippet": _snippet(p.text, query),
            "is_placeholder": p.is_placeholder,
        }
        for p in _search(paragraphs, ["text"], query, exact)[:MAX_PER_GROUP]
    ]

    chapters = Chapter.objects.filter(is_published=True)
    if book:
        chapters = chapters.filter(book__slug=book)
    results["chapters"] = [
        {"type": "chapter", "slug": c.slug, "number": c.number, "title": c.title, "subtitle": c.subtitle}
        for c in _search(chapters, ["title", "subtitle", "introduction", "summary"], query, exact)[:MAX_PER_GROUP]
    ]

    principles_qs = Principle.objects.filter(is_published=True)
    results["principles"] = [
        {
            "type": "principle", "slug": p.slug, "name": p.name, "number": p.number,
            "accent": p.accent, "snippet": _snippet(p.summary or p.plain_explanation, query),
        }
        for p in _search(
            principles_qs, ["name", "summary", "plain_explanation", "deep_interpretation"], query, exact
        )[:MAX_PER_GROUP]
    ]

    annotations = Annotation.objects.filter(status=Annotation.Status.PUBLISHED).select_related(
        "annotation_type", "passage__paragraph__section__chapter"
    )
    if book:
        annotations = annotations.filter(passage__paragraph__section__chapter__book__slug=book)
    if chapter:
        annotations = annotations.filter(passage__paragraph__section__chapter__slug=chapter)
    results["annotations"] = [
        {
            "type": "annotation",
            "id": a.id,
            "annotation_type": a.annotation_type.slug,
            "title": a.title,
            "origin": a.origin,
            "passage_slug": a.passage.slug,
            "chapter": _chapter_of(a.passage.paragraph),
            "snippet": _snippet(a.body, query),
        }
        for a in _search(annotations, ["title", "body"], query, exact)[:MAX_PER_GROUP]
    ]

    definitions = Definition.objects.all()
    results["definitions"] = [
        {"type": "definition", "slug": d.slug, "term": d.term, "snippet": _snippet(d.meaning, query)}
        for d in _search(definitions, ["term", "meaning"], query, exact)[:MAX_PER_GROUP]
    ]

    return results


def search_private(query, user, exact=False):
    results = {}

    notes = user.notes.all()
    results["notes"] = [
        {
            "type": "note", "id": n.id, "kind": n.kind, "object_id": n.object_id,
            "chapter_slug": n.chapter_slug, "title": n.title, "snippet": _snippet(n.body, query),
        }
        for n in _search(notes, ["title", "body"], query, exact)[:MAX_PER_GROUP]
    ]

    journal = user.journal_entries.all()
    results["journal"] = [
        {"type": "journal", "id": e.id, "kind": e.kind, "title": e.title, "snippet": _snippet(e.body, query)}
        for e in _search(journal, ["title", "body"], query, exact)[:MAX_PER_GROUP]
    ]

    highlights = user.highlights.select_related("paragraph__section__chapter")
    results["highlights"] = [
        {
            "type": "highlight", "id": h.id, "paragraph_id": h.paragraph_id,
            "chapter": _chapter_of(h.paragraph), "snippet": _snippet(h.text, query),
        }
        for h in _search(highlights, ["text", "note"], query, exact)[:MAX_PER_GROUP]
    ]

    bookmarks = user.bookmarks.all()
    results["bookmarks"] = [
        {
            "type": "bookmark", "id": b.id, "kind": b.kind, "object_id": b.object_id,
            "chapter_slug": b.chapter_slug, "title": b.title or b.label, "snippet": _snippet(b.note, query),
        }
        for b in _search(bookmarks, ["title", "note", "label"], query, exact)[:MAX_PER_GROUP]
    ]

    return results
