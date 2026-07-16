from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from common.models import TimeStampedModel


class Highlight(TimeStampedModel):
    """User highlight anchored to a paragraph via stable character offsets.

    Anchoring to paragraph identity + offsets (never pixel coordinates) means
    highlights survive font, width, and layout changes. The highlighted text
    is also captured verbatim so a highlight can be re-anchored if the source
    paragraph text is ever corrected.
    """

    class Style(models.TextChoices):
        GOLD = "gold", "Tarnished gold"
        EMBER = "ember", "Ember"
        VIOLET = "violet", "Desaturated violet"
        SAGE = "sage", "Oxidised sage"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="highlights")
    paragraph = models.ForeignKey("library.Paragraph", on_delete=models.CASCADE, related_name="highlights")
    start_offset = models.PositiveIntegerField()
    end_offset = models.PositiveIntegerField()
    text = models.TextField()
    style = models.CharField(max_length=12, choices=Style.choices, default=Style.GOLD)
    note = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "paragraph"])]

    def __str__(self):
        return f"{self.user} highlight ¶{self.paragraph_id} [{self.start_offset}:{self.end_offset}]"

    def clean(self):
        if self.end_offset <= self.start_offset:
            raise ValidationError({"end_offset": "end_offset must be greater than start_offset."})
