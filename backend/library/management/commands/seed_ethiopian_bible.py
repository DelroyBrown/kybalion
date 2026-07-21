"""
Load the Ethiopian Bible: the assembled public-domain broader canon.

The text comes from library/data/ethiopian_bible.json (generated from the
raw sources by scripts/build_ethiopian_bible.py — see sources/MANIFEST.md
for full provenance and licensing).

Replaces existing ETHIOPIAN BIBLE content only. The Kybalion, its study
layer, and all user-created data are never touched.

Usage:
    python manage.py seed_ethiopian_bible
    python manage.py seed_ethiopian_bible --if-empty   # deploy-safe no-op
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from library.models import Book, Chapter, Edition, Paragraph, Section

BOOK_SLUG = "ethiopian-bible"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "ethiopian_bible.json"


class Command(BaseCommand):
    help = "Seed the Ethiopian Bible (broader canon) from the assembled public-domain edition."

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Only seed when the Ethiopian Bible is not present yet (safe on every deploy).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["if_empty"] and Book.objects.filter(slug=BOOK_SLUG).exists():
            self.stdout.write("Ethiopian Bible already present — skipping seed (--if-empty).")
            return
        if not DATA_PATH.exists():
            raise CommandError(
                f"Content not found at {DATA_PATH}. Generate it with "
                "`python scripts/build_ethiopian_bible.py` (see sources/MANIFEST.md)."
            )
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

        # Replace only this book; annotations/passages cascade with chapters.
        Book.objects.filter(slug=BOOK_SLUG).delete()

        book = Book.objects.create(**data["book"])
        edition = Edition.objects.create(book=book, **data["edition"])

        paragraphs = []
        for entry in data["books"]:
            chapter = Chapter.objects.create(
                book=book,
                edition=edition,
                slug=f"eb-{entry['slug']}",
                number=entry["number"],
                title=entry["title"],
                subtitle=entry["subtitle"],
                introduction=entry.get("intro", ""),
                order=entry["number"],
            )
            for section_data in entry["sections"]:
                section = Section.objects.create(
                    chapter=chapter,
                    slug=f"s{section_data['order']}",
                    title=section_data["title"],
                    order=section_data["order"],
                )
                for p in section_data["paragraphs"]:
                    paragraphs.append(Paragraph(
                        section=section,
                        order=p["order"],
                        text=p["text"],
                        kind=p.get("kind", "body"),
                        is_placeholder=p.get("is_placeholder", False),
                    ))
        Paragraph.objects.bulk_create(paragraphs, batch_size=2000)

        placeholder_books = sum(1 for entry in data["books"] if entry.get("placeholder"))
        self.stdout.write(self.style.SUCCESS(
            f"Seeded the Ethiopian Bible: {book.chapters.count()} books "
            f"({placeholder_books} placeholders), "
            f"{Section.objects.filter(chapter__book=book).count()} chapters/sections, "
            f"{len(paragraphs)} paragraphs."
        ))
