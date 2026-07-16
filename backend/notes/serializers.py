from rest_framework import serializers

from bookmarks.serializers import TagListField
from principles.models import Principle

from .models import UserNote


class UserNoteSerializer(serializers.ModelSerializer):
    tags = TagListField(required=False)
    linked_principle = serializers.SlugRelatedField(
        slug_field="slug", queryset=Principle.objects.all(), required=False, allow_null=True
    )
    character_count = serializers.SerializerMethodField()

    class Meta:
        model = UserNote
        fields = [
            "id", "kind", "object_id", "chapter_slug", "label", "title", "body",
            "tags", "pinned", "linked_principle", "character_count", "created_at", "updated_at",
        ]

    def get_character_count(self, obj):
        return len(obj.body or "")
