from django.conf import settings
from django.db import models

from common.models import TimeStampedModel

DEFAULT_READER_SETTINGS = {
    "fontScale": 1.0,
    "lineHeight": 1.9,
    "width": "comfortable",  # narrow | comfortable | wide
    "theme": "midnight",  # midnight | obsidian | parchment | sepia | crimson | abyss | sanctum
    "mode": "guided",  # clean | guided | study | reflection
    "showParagraphNumbers": False,
    "ambientEffects": True,
    "reduceMotion": False,
    "showStreak": False,
}


class ReaderPreference(TimeStampedModel):
    """Per-user reader settings, mirrored locally for anonymous visitors."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reader_preference")
    settings = models.JSONField(default=dict)

    def __str__(self):
        return f"Reader preferences for {self.user}"

    def merged_settings(self):
        return {**DEFAULT_READER_SETTINGS, **(self.settings or {})}
