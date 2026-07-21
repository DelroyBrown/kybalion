"""
Load seed content: the verbatim 1908 text plus the curated study layer.

The original text comes from library/data/kybalion_1908.json (generated from
the public-domain Project Gutenberg transcription by
scripts/import_gutenberg.py). Curated passages anchor to that text by exact
phrase search — a phrase that cannot be found aborts the seed so the
annotation layer can never silently drift from the text.

Replaces existing BOOK CONTENT (book, chapters, principles, annotations,
definitions). User-created data (accounts, notes, highlights, bookmarks,
journal entries) is never touched.

Usage:
    python manage.py seed_content
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from annotations.models import (
    Annotation,
    AnnotationSource,
    AnnotationType,
    Definition,
    PassageRelationship,
    VisualisationReference,
)
from library import seed_curation, seed_data
from library.models import Book, Chapter, Edition, Paragraph, Passage, Section, SourceReference
from principles.models import (
    Principle,
    PrincipleExample,
    PrincipleMisunderstanding,
    PrincipleReflectionPrompt,
    PrincipleRelationship,
)

BOOK_TEXT_PATH = Path(__file__).resolve().parents[2] / "data" / "kybalion_1908.json"


class Command(BaseCommand):
    help = "Seed the database with the verbatim 1908 text and curated commentary (keeps user data)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--if-empty",
            action="store_true",
            help="Only seed when no book exists yet (safe to run on every deploy).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["if_empty"] and Book.objects.filter(slug=seed_data.BOOK["slug"]).exists():
            self.stdout.write("Content already present — skipping seed (--if-empty).")
            return
        book_text = self._load_book_text()
        self._wipe_content()
        principles = self._create_principles()
        self._create_principle_relationships(principles)
        types = self._create_annotation_types()
        definitions = self._create_definitions()
        book, edition = self._create_book()
        chapters = self._create_chapters(book, edition, book_text)
        passages = self._create_passages(chapters, principles, types, definitions)
        self._create_related_passages(passages)
        self._create_visualisations(principles)
        self._create_general_prompts()

        placeholders = Paragraph.objects.filter(is_placeholder=True).count()
        self.stdout.write(self.style.SUCCESS(
            f"Seeded: {Chapter.objects.count()} chapters, {Paragraph.objects.count()} paragraphs "
            f"({placeholders} placeholders), {Passage.objects.count()} passages, "
            f"{Annotation.objects.count()} annotations, {Principle.objects.count()} principles, "
            f"{Definition.objects.count()} definitions."
        ))

    def _load_book_text(self):
        if not BOOK_TEXT_PATH.exists():
            raise CommandError(
                f"Book text not found at {BOOK_TEXT_PATH}. Generate it with "
                "`python scripts/import_gutenberg.py <path-to-gutenberg-html>` (see docs/CONTENT.md)."
            )
        data = json.loads(BOOK_TEXT_PATH.read_text(encoding="utf-8"))
        return {chapter["number"]: chapter for chapter in data["chapters"]}

    def _wipe_content(self):
        # Order matters: annotations cascade from passages via the book tree,
        # after which the PROTECTed AnnotationType rows can be removed.
        # Scoped to the Kybalion — other books (the Ethiopian Bible) are
        # seeded and wiped by their own commands.
        Book.objects.filter(slug=seed_data.BOOK["slug"]).delete()
        VisualisationReference.objects.all().delete()
        AnnotationType.objects.all().delete()
        Definition.objects.all().delete()
        Principle.objects.all().delete()
        PrincipleReflectionPrompt.objects.all().delete()

    def _create_principles(self):
        principles = {}
        for entry in seed_data.PRINCIPLES:
            principle = Principle.objects.create(
                slug=entry["slug"], number=entry["number"], name=entry["name"],
                aphorism=entry["aphorism"], aphorism_source=entry["aphorism_source"],
                summary=entry["summary"], plain_explanation=entry["plain_explanation"],
                deep_interpretation=entry["deep_interpretation"], editorial_note=entry["editorial_note"],
                accent=entry["accent"], symbol=entry["symbol"], visualisation_key=entry["visualisation_key"],
            )
            for i, example in enumerate(entry["examples"]):
                PrincipleExample.objects.create(principle=principle, order=i, **example)
            for i, item in enumerate(entry["misunderstandings"]):
                PrincipleMisunderstanding.objects.create(principle=principle, order=i, **item)
            for i, prompt in enumerate(entry["prompts"]):
                PrincipleReflectionPrompt.objects.create(
                    principle=principle, prompt=prompt, context="principle", order=i
                )
            principles[entry["slug"]] = principle
        return principles

    def _create_principle_relationships(self, principles):
        for from_slug, to_slug, kind, description in seed_data.PRINCIPLE_RELATIONSHIPS:
            PrincipleRelationship.objects.create(
                from_principle=principles[from_slug], to_principle=principles[to_slug],
                kind=kind, description=description,
            )

    def _create_annotation_types(self):
        return {
            entry["slug"]: AnnotationType.objects.create(**entry)
            for entry in seed_data.ANNOTATION_TYPES
        }

    def _create_definitions(self):
        return {
            entry["slug"]: Definition.objects.create(**entry)
            for entry in seed_data.DEFINITIONS
        }

    def _create_book(self):
        book = Book.objects.create(**seed_data.BOOK)
        edition = Edition.objects.create(book=book, **seed_data.EDITION)
        for ref in seed_data.SOURCE_REFERENCES:
            SourceReference.objects.create(edition=edition, **ref)
        return book, edition

    def _create_chapters(self, book, edition, book_text):
        """One chapter per CHAPTER_META entry, filled with the verbatim text."""
        chapters = {}
        for meta in seed_curation.CHAPTER_META:
            source = book_text.get(meta["number"])
            if source is None:
                raise CommandError(f"Chapter {meta['number']} missing from {BOOK_TEXT_PATH.name}.")
            chapter = Chapter.objects.create(
                book=book, edition=edition,
                slug=meta["slug"], number=meta["number"], title=meta["title"],
                introduction=meta["introduction"], summary=meta["summary"],
                order=meta["number"],
            )
            section = Section.objects.create(chapter=chapter, slug="text", title="", order=1)
            Paragraph.objects.bulk_create([
                Paragraph(
                    section=section, order=index + 1,
                    text=paragraph["text"], kind=paragraph["kind"],
                    is_placeholder=False,
                )
                for index, paragraph in enumerate(source["paragraphs"])
            ])
            chapters[meta["number"]] = chapter
        return chapters

    def _create_passages(self, chapters, principles, types, definitions):
        """Anchor each curated passage to the real text by exact phrase search."""
        passages = {}
        for spec in seed_curation.CURATED_PASSAGES:
            chapter = chapters[spec["chapter"]]
            paragraph, start = self._locate(chapter, spec["phrase"])
            if paragraph is None:
                raise CommandError(
                    f"Passage '{spec['slug']}': phrase not found in chapter {spec['chapter']} — "
                    f"“{spec['phrase'][:60]}…”"
                )
            end = start + len(spec["phrase"])
            passage = Passage.objects.create(
                slug=spec["slug"], paragraph=paragraph,
                start_offset=start, end_offset=end,
                excerpt=paragraph.text[start:end],  # actual text, preserving original casing
                is_placeholder=False,
            )
            passage.principles.set([principles[slug] for slug in spec["principles"]])
            for definition_slug in spec["definitions"]:
                definitions[definition_slug].passages.add(passage)
            for order, annotation_entry in enumerate(spec["annotations"]):
                self._create_annotation(passage, annotation_entry, order, principles, types)
            passages[spec["slug"]] = passage
        return passages

    @staticmethod
    def _locate(chapter, phrase):
        needle = phrase.lower()
        for paragraph in Paragraph.objects.filter(section__chapter=chapter).order_by("section__order", "order"):
            index = paragraph.text.lower().find(needle)
            if index != -1:
                return paragraph, index
        return None, None

    @staticmethod
    def _create_annotation(passage, entry, order, principles, types):
        annotation = Annotation.objects.create(
            passage=passage,
            annotation_type=types[entry["type"]],
            title=entry.get("title", ""),
            body=entry["body"],
            origin=entry.get("origin", Annotation.Origin.EDITORIAL),
            attribution=entry.get("attribution", "Editorial commentary written for this digital edition."),
            order=order,
            ai_model=entry.get("ai_model", ""),
            ai_prompt_kind=entry.get("ai_prompt_kind", ""),
            ai_generated_at=timezone.now() if entry.get("origin") == "ai" else None,
            ai_reviewed=entry.get("ai_reviewed", False),
        )
        if entry.get("principles"):
            annotation.related_principles.set([principles[slug] for slug in entry["principles"]])
        for source in entry.get("sources", []):
            AnnotationSource.objects.create(annotation=annotation, **source)

    def _create_related_passages(self, passages):
        for from_slug, to_slug, kind, note in seed_curation.RELATED_PASSAGES:
            PassageRelationship.objects.create(
                from_passage=passages[from_slug], to_passage=passages[to_slug], kind=kind, note=note,
            )

    def _create_visualisations(self, principles):
        for entry in seed_data.VISUALISATIONS:
            data = dict(entry)
            principle_slug = data.pop("principle")
            VisualisationReference.objects.create(principle=principles[principle_slug], **data)

    def _create_general_prompts(self):
        for i, entry in enumerate(seed_data.GENERAL_PROMPTS):
            PrincipleReflectionPrompt.objects.create(
                principle=None, prompt=entry["prompt"], context=entry["context"], order=100 + i,
            )
