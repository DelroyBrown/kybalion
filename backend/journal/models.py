from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class JournalEntry(TimeStampedModel):
    """Private reflection. A prompted entry stores the prompt it responds to
    (covering the JournalPromptResponse concept without a second table)."""

    class Kind(models.TextChoices):
        FREE = "free", "Free writing"
        PASSAGE = "passage", "Passage reflection"
        PRINCIPLE = "principle", "Principle reflection"
        PROMPT = "prompt", "Guided prompt"
        CHAPTER = "chapter", "End-of-chapter reflection"
        DAILY = "daily", "Daily reflection"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="journal_entries")
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.FREE)
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    favourite = models.BooleanField(default=False)
    is_draft = models.BooleanField(default=False)
    passage = models.ForeignKey(
        "library.Passage", on_delete=models.SET_NULL, null=True, blank=True, related_name="journal_entries"
    )
    principle = models.ForeignKey(
        "principles.Principle", on_delete=models.SET_NULL, null=True, blank=True, related_name="journal_entries"
    )
    chapter = models.ForeignKey(
        "library.Chapter", on_delete=models.SET_NULL, null=True, blank=True, related_name="journal_entries"
    )
    prompt = models.ForeignKey(
        "principles.PrincipleReflectionPrompt",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journal_entries",
    )

    class Meta:
        ordering = ["-updated_at"]
        verbose_name_plural = "journal entries"
        indexes = [models.Index(fields=["user", "-updated_at"])]

    def __str__(self):
        return f"{self.user} — {self.title or self.kind} ({self.created_at:%Y-%m-%d})"
