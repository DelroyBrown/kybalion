"""
Structurally addressable book content.

Book -> Edition -> Chapter -> Section -> Paragraph -> Passage

Original text lives in Paragraph rows so it stays addressable; passages are
curated spans within a paragraph identified by stable character offsets.
Placeholder content (awaiting a verified public-domain edition) is flagged
with `is_placeholder` and must never be presented as original text.
"""
from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel


class Book(TimeStampedModel):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    author_attribution = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    published_year = models.PositiveIntegerField(null=True, blank=True)
    is_public_domain = models.BooleanField(default=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class Edition(TimeStampedModel):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="editions")
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=200)
    publisher = models.CharField(max_length=200, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    source_url = models.URLField(blank=True)
    source_notes = models.TextField(
        blank=True, help_text="Provenance of the text: where it was obtained and how it was verified."
    )
    license_note = models.CharField(max_length=300, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_primary", "year"]

    def __str__(self):
        return f"{self.book.title} — {self.name}"


class Chapter(TimeStampedModel):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="chapters")
    edition = models.ForeignKey(
        Edition, on_delete=models.SET_NULL, null=True, blank=True, related_name="chapters"
    )
    slug = models.SlugField(unique=True)
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    introduction = models.TextField(blank=True, help_text="Editorial introduction — not original text.")
    summary = models.TextField(blank=True, help_text="Editorial end-of-chapter summary — not original text.")
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "number"]
        constraints = [
            models.UniqueConstraint(fields=["book", "number"], name="unique_chapter_number_per_book")
        ]

    def __str__(self):
        return f"{self.number}. {self.title}"


class Section(TimeStampedModel):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="sections")
    slug = models.SlugField()
    title = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(fields=["chapter", "order"], name="unique_section_order_per_chapter"),
            models.UniqueConstraint(fields=["chapter", "slug"], name="unique_section_slug_per_chapter"),
        ]

    def __str__(self):
        return f"{self.chapter.slug} / {self.title or self.slug}"


class Paragraph(TimeStampedModel):
    class Kind(models.TextChoices):
        BODY = "body", "Body text"
        EPIGRAPH = "epigraph", "Epigraph / axiom"
        QUOTE = "quote", "Quotation"
        EDITORIAL = "editorial", "Editorial note"

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="paragraphs")
    order = models.PositiveIntegerField(default=0)
    text = models.TextField()
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.BODY)
    is_placeholder = models.BooleanField(
        default=False,
        help_text="True while this paragraph holds placeholder copy awaiting the verified public-domain text.",
    )

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(fields=["section", "order"], name="unique_paragraph_order_per_section")
        ]
        indexes = [models.Index(fields=["section", "order"])]

    def __str__(self):
        return f"{self.section} ¶{self.order}"

    @property
    def reference(self):
        return f"{self.section.chapter.number}.{self.section.order}.{self.order}"


class Passage(TimeStampedModel):
    """A curated, annotatable span of text inside a paragraph."""

    slug = models.SlugField(unique=True)
    paragraph = models.ForeignKey(Paragraph, on_delete=models.CASCADE, related_name="passages")
    start_offset = models.PositiveIntegerField()
    end_offset = models.PositiveIntegerField()
    excerpt = models.TextField(help_text="Canonical text of the span; must match paragraph text at the offsets.")
    is_placeholder = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    principles = models.ManyToManyField("principles.Principle", blank=True, related_name="passages")

    class Meta:
        ordering = ["paragraph__order", "start_offset"]
        indexes = [models.Index(fields=["paragraph"])]

    def __str__(self):
        return f"{self.slug}: “{self.excerpt[:60]}”"

    def clean(self):
        if self.end_offset <= self.start_offset:
            raise ValidationError("end_offset must be greater than start_offset.")
        if self.paragraph_id and self.paragraph.text[self.start_offset : self.end_offset] != self.excerpt:
            raise ValidationError("excerpt does not match the paragraph text at the given offsets.")


class SourceReference(TimeStampedModel):
    edition = models.ForeignKey(Edition, on_delete=models.CASCADE, related_name="source_references")
    citation = models.TextField()
    url = models.URLField(blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.citation[:80]
