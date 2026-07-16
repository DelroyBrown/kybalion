from rest_framework import serializers

from library.models import Chapter

from .models import ReadingProgress, ReadingSession


class ReadingProgressSerializer(serializers.ModelSerializer):
    chapter = serializers.SlugRelatedField(slug_field="slug", queryset=Chapter.objects.filter(is_published=True))
    chapter_title = serializers.CharField(source="chapter.title", read_only=True)
    chapter_number = serializers.IntegerField(source="chapter.number", read_only=True)

    class Meta:
        model = ReadingProgress
        fields = [
            "id", "chapter", "chapter_title", "chapter_number",
            "last_paragraph_order", "furthest_paragraph_order",
            "percent_complete", "completed", "completed_at", "updated_at",
        ]
        read_only_fields = ["completed_at"]

    def validate_percent_complete(self, value):
        return max(0.0, min(100.0, value))


class ReadingSessionSerializer(serializers.ModelSerializer):
    chapter = serializers.SlugRelatedField(
        slug_field="slug", queryset=Chapter.objects.filter(is_published=True),
        required=False, allow_null=True,
    )

    class Meta:
        model = ReadingSession
        fields = ["id", "chapter", "started_at", "duration_seconds"]

    def validate_duration_seconds(self, value):
        # Cap at 8 hours so a sleeping laptop can't record a marathon.
        return min(value, 8 * 60 * 60)
