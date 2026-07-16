from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Bookmark(TimeStampedModel):
    """A saved pointer to anywhere in the experience.

    `kind` + `object_id` (a slug or primary key rendered as text) identify the
    target; `chapter_slug` and `label` are denormalised so lists render and
    link without extra queries even if the target is later unpublished.
    """

    class Kind(models.TextChoices):
        CHAPTER = "chapter", "Chapter"
        SECTION = "section", "Section"
        PARAGRAPH = "paragraph", "Paragraph"
        PASSAGE = "passage", "Passage"
        ANNOTATION = "annotation", "Annotation"
        PRINCIPLE = "principle", "Principle"
        VISUALISATION = "visualisation", "Visualisation"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    kind = models.CharField(max_length=16, choices=Kind.choices)
    object_id = models.CharField(max_length=120)
    label = models.CharField(max_length=300, blank=True)
    chapter_slug = models.SlugField(blank=True)
    title = models.CharField(max_length=200, blank=True)
    note = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "kind", "object_id"], name="unique_bookmark_per_target")
        ]
        indexes = [models.Index(fields=["user", "kind"])]

    def __str__(self):
        return f"{self.user} ⭑ {self.kind}:{self.object_id}"
