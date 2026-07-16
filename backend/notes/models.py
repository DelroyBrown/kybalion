from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class UserNote(TimeStampedModel):
    """Private note attached to a location in the experience (same addressing
    scheme as bookmarks: kind + object_id)."""

    class Kind(models.TextChoices):
        PASSAGE = "passage", "Passage"
        ANNOTATION = "annotation", "Annotation"
        CHAPTER = "chapter", "Chapter"
        PRINCIPLE = "principle", "Principle"
        VISUALISATION = "visualisation", "Visualisation"
        JOURNAL = "journal", "Journal entry"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")
    kind = models.CharField(max_length=16, choices=Kind.choices)
    object_id = models.CharField(max_length=120)
    chapter_slug = models.SlugField(blank=True)
    label = models.CharField(max_length=300, blank=True)
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    pinned = models.BooleanField(default=False)
    linked_principle = models.ForeignKey(
        "principles.Principle", on_delete=models.SET_NULL, null=True, blank=True, related_name="user_notes"
    )

    class Meta:
        ordering = ["-pinned", "-updated_at"]
        indexes = [models.Index(fields=["user", "kind", "object_id"])]

    def __str__(self):
        return f"{self.user} note on {self.kind}:{self.object_id}"
