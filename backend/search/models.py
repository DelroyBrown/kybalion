from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class RecentSearch(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recent_searches")
    query = models.CharField(max_length=200)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "recent searches"

    def __str__(self):
        return f"{self.user}: {self.query}"
