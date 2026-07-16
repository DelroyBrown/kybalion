from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import Bookmark


class TagListField(serializers.JSONField):
    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if not isinstance(value, list) or not all(isinstance(tag, str) for tag in value):
            raise serializers.ValidationError("Tags must be a list of strings.")
        return [tag.strip()[:40] for tag in value if tag.strip()][:20]


class BookmarkSerializer(serializers.ModelSerializer):
    tags = TagListField(required=False)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Bookmark
        fields = [
            "id", "user", "kind", "object_id", "label", "chapter_slug",
            "title", "note", "tags", "created_at",
        ]
        validators = [
            UniqueTogetherValidator(
                queryset=Bookmark.objects.all(),
                fields=["user", "kind", "object_id"],
                message="This item is already bookmarked.",
            )
        ]
