"""
Load The Crisis: the public-domain run (Nov 1910 - Dec 1930) of the NAACP's
monthly magazine, founded and edited by W. E. B. Du Bois.

The text comes from library/data/the_crisis.json (generated from the
Internet Archive's microfilm scans by scripts/build_crisis.py — see
sources/MANIFEST.md for provenance and licensing). Every issue is one
Chapter; its departments and articles are Sections.

Replaces existing THE CRISIS content only. Other books, their study
layers, and all user-created data are never touched.

Usage:
    python manage.py seed_the_crisis
    python manage.py seed_the_crisis --if-empty   # deploy-safe no-op
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from library.models import Book, Chapter, Edition, Paragraph, Section

BOOK_SLUG = "the-crisis"
DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "the_crisis.json"


class Command(BaseCommand):
    help = "Seed The Crisis (1910-1930) from the Internet Archive OCR edition."

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Only seed when The Crisis is not present yet (safe on every deploy).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["if_empty"] and Book.objects.filter(slug=BOOK_SLUG).exists():
            self.stdout.write("The Crisis already present — skipping seed (--if-empty).")
            return
        if not DATA_PATH.exists():
            raise CommandError(
                f"Content not found at {DATA_PATH}. Generate it with "
                "`python scripts/download_crisis.py` then "
                "`python scripts/build_crisis.py` (see sources/MANIFEST.md)."
            )
        data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

        # Replace only this book; sections/paragraphs cascade with chapters.
        Book.objects.filter(slug=BOOK_SLUG).delete()

        book = Book.objects.create(**data["book"])
        edition = Edition.objects.create(book=book, **data["edition"])

        paragraphs = []
        for issue in data["issues"]:
            chapter = Chapter.objects.create(
                book=book,
                edition=edition,
                slug=issue["slug"],
                number=issue["number"],
                title=issue["title"],
                subtitle=issue["subtitle"],
                source_url=issue.get("source_url", ""),
                order=issue["number"],
            )
            for section_data in issue["sections"]:
                section = Section.objects.create(
                    chapter=chapter,
                    slug=f"s{section_data['order']}",
                    title=section_data["title"],
                    order=section_data["order"],
                )
                for paragraph in section_data["paragraphs"]:
                    paragraphs.append(Paragraph(
                        section=section,
                        order=paragraph["order"],
                        text=paragraph["text"],
                        kind=paragraph.get("kind", "body"),
                    ))
        Paragraph.objects.bulk_create(paragraphs, batch_size=2000)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded The Crisis: {book.chapters.count()} issues, "
            f"{Section.objects.filter(chapter__book=book).count()} sections, "
            f"{len(paragraphs)} paragraphs."
        ))
