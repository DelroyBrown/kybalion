"""
Commentary layered over the original text.

Annotations are always clearly attributed (editorial vs AI-generated) and are
never mixed into the original paragraph text. Publishing is soft-controlled
via `status` so drafts stay out of the API.
"""
from django.db import models

from common.models import TimeStampedModel


class AnnotationType(TimeStampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True, help_text="Frontend icon key.")
    accent = models.CharField(max_length=40, blank=True, help_text="Frontend design-token key.")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.name


class Annotation(TimeStampedModel):
    class Origin(models.TextChoices):
        EDITORIAL = "editorial", "Editorial"
        AI = "ai", "AI-generated"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    passage = models.ForeignKey("library.Passage", on_delete=models.CASCADE, related_name="annotations")
    annotation_type = models.ForeignKey(AnnotationType, on_delete=models.PROTECT, related_name="annotations")
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField()
    origin = models.CharField(max_length=12, choices=Origin.choices, default=Origin.EDITORIAL)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PUBLISHED)
    version = models.PositiveIntegerField(default=1)
    attribution = models.CharField(max_length=300, blank=True)
    order = models.PositiveIntegerField(default=0)
    related_principles = models.ManyToManyField("principles.Principle", blank=True, related_name="annotations")

    # AI provenance — required context whenever origin == AI.
    ai_model = models.CharField(max_length=100, blank=True)
    ai_prompt_kind = models.CharField(max_length=100, blank=True)
    ai_generated_at = models.DateTimeField(null=True, blank=True)
    ai_reviewed = models.BooleanField(default=False, help_text="Has an editor reviewed this AI output?")

    class Meta:
        ordering = ["order", "id"]
        indexes = [models.Index(fields=["passage", "status"])]

    def __str__(self):
        return f"[{self.annotation_type.slug}] {self.title or self.body[:60]}"


class Definition(TimeStampedModel):
    slug = models.SlugField(unique=True)
    term = models.CharField(max_length=120)
    meaning = models.TextField()
    etymology = models.TextField(blank=True)
    passages = models.ManyToManyField("library.Passage", blank=True, related_name="definitions")

    class Meta:
        ordering = ["term"]

    def __str__(self):
        return self.term


class PassageRelationship(TimeStampedModel):
    class Kind(models.TextChoices):
        PARALLEL = "parallel", "Parallel idea"
        CONTRAST = "contrast", "Contrasting idea"
        DEVELOPS = "develops", "Develops further"
        REFERENCES = "references", "References"

    from_passage = models.ForeignKey("library.Passage", on_delete=models.CASCADE, related_name="related_out")
    to_passage = models.ForeignKey("library.Passage", on_delete=models.CASCADE, related_name="related_in")
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.PARALLEL)
    note = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["from_passage", "to_passage"], name="unique_passage_relationship")
        ]

    def __str__(self):
        return f"{self.from_passage.slug} → {self.to_passage.slug} ({self.kind})"


class AnnotationSource(TimeStampedModel):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE, related_name="sources")
    citation = models.CharField(max_length=400)
    url = models.URLField(blank=True)

    def __str__(self):
        return self.citation[:80]


class VisualisationReference(TimeStampedModel):
    """Points a passage or principle at a frontend visualisation component."""

    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="Written explanation — also serves as the accessible text alternative.")
    component_key = models.CharField(max_length=60, help_text="Frontend component key, e.g. 'vibration'.")
    principle = models.ForeignKey(
        "principles.Principle", on_delete=models.SET_NULL, null=True, blank=True, related_name="visualisations"
    )
    passage = models.ForeignKey(
        "library.Passage", on_delete=models.SET_NULL, null=True, blank=True, related_name="visualisations"
    )

    def __str__(self):
        return self.title
