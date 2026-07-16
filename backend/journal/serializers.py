from rest_framework import serializers

from bookmarks.serializers import TagListField
from library.models import Chapter, Passage
from principles.models import Principle, PrincipleReflectionPrompt

from .models import JournalEntry


class JournalEntrySerializer(serializers.ModelSerializer):
    tags = TagListField(required=False)
    passage = serializers.SlugRelatedField(
        slug_field="slug", queryset=Passage.objects.all(), required=False, allow_null=True
    )
    principle = serializers.SlugRelatedField(
        slug_field="slug", queryset=Principle.objects.all(), required=False, allow_null=True
    )
    chapter = serializers.SlugRelatedField(
        slug_field="slug", queryset=Chapter.objects.all(), required=False, allow_null=True
    )
    prompt = serializers.PrimaryKeyRelatedField(
        queryset=PrincipleReflectionPrompt.objects.all(), required=False, allow_null=True
    )
    prompt_text = serializers.CharField(source="prompt.prompt", read_only=True)
    passage_excerpt = serializers.CharField(source="passage.excerpt", read_only=True)
    principle_name = serializers.CharField(source="principle.name", read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            "id", "kind", "title", "body", "tags", "favourite", "is_draft",
            "passage", "passage_excerpt", "principle", "principle_name",
            "chapter", "prompt", "prompt_text", "created_at", "updated_at",
        ]
