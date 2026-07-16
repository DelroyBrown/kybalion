from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class ReadingProgress(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reading_progress")
    chapter = models.ForeignKey("library.Chapter", on_delete=models.CASCADE, related_name="reading_progress")
    last_paragraph_order = models.PositiveIntegerField(default=0)
    furthest_paragraph_order = models.PositiveIntegerField(default=0)
    percent_complete = models.FloatField(default=0.0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "chapter"], name="unique_progress_per_user_chapter")
        ]
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user} — {self.chapter} ({self.percent_complete:.0f}%)"


class ReadingSession(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reading_sessions")
    chapter = models.ForeignKey(
        "library.Chapter", on_delete=models.SET_NULL, null=True, blank=True, related_name="reading_sessions"
    )
    started_at = models.DateTimeField()
    duration_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user} session {self.started_at:%Y-%m-%d %H:%M}"
