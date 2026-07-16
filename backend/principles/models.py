from django.db import models

from common.models import TimeStampedModel


class Principle(TimeStampedModel):
    slug = models.SlugField(unique=True)
    number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=120)
    aphorism = models.TextField(blank=True, help_text="The axiom associated with the principle, with source.")
    aphorism_source = models.CharField(max_length=300, blank=True)
    summary = models.TextField(blank=True)
    plain_explanation = models.TextField(blank=True)
    deep_interpretation = models.TextField(blank=True)
    editorial_note = models.TextField(
        blank=True, help_text="Editorial context, e.g. how historical terminology differs from modern usage."
    )
    accent = models.CharField(max_length=40, blank=True, help_text="Design-token key used by the frontend.")
    symbol = models.CharField(max_length=40, blank=True, help_text="Symbol key for the frontend icon system.")
    visualisation_key = models.CharField(max_length=40, blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["number"]

    def __str__(self):
        return self.name


class PrincipleRelationship(TimeStampedModel):
    class Kind(models.TextChoices):
        COMPLEMENTS = "complements", "Complements"
        CONTRASTS = "contrasts", "Contrasts with"
        BUILDS_ON = "builds_on", "Builds on"
        EXPRESSES = "expresses", "Expresses"

    from_principle = models.ForeignKey(Principle, on_delete=models.CASCADE, related_name="relationships_out")
    to_principle = models.ForeignKey(Principle, on_delete=models.CASCADE, related_name="relationships_in")
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.COMPLEMENTS)
    description = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["from_principle", "to_principle", "kind"], name="unique_principle_relationship"
            )
        ]

    def __str__(self):
        return f"{self.from_principle.name} {self.kind} {self.to_principle.name}"


class PrincipleExample(TimeStampedModel):
    class Kind(models.TextChoices):
        MODERN = "modern", "Modern example"
        PRACTICAL = "practical", "Practical everyday example"

    principle = models.ForeignKey(Principle, on_delete=models.CASCADE, related_name="examples")
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.MODERN)
    title = models.CharField(max_length=200)
    body = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class PrincipleMisunderstanding(TimeStampedModel):
    principle = models.ForeignKey(Principle, on_delete=models.CASCADE, related_name="misunderstandings")
    claim = models.CharField(max_length=300, help_text="The common misreading, stated plainly.")
    clarification = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.claim


class PrincipleReflectionPrompt(TimeStampedModel):
    class Context(models.TextChoices):
        PRINCIPLE = "principle", "Principle study"
        CHAPTER = "chapter", "End of chapter"
        DAILY = "daily", "Daily reflection"

    principle = models.ForeignKey(
        Principle, on_delete=models.CASCADE, null=True, blank=True, related_name="reflection_prompts"
    )
    prompt = models.TextField()
    context = models.CharField(max_length=12, choices=Context.choices, default=Context.PRINCIPLE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.prompt[:80]
