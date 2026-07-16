from rest_framework import serializers

from bookmarks.serializers import TagListField
from library.models import Paragraph

from .models import Highlight


class HighlightSerializer(serializers.ModelSerializer):
    tags = TagListField(required=False)
    paragraph = serializers.PrimaryKeyRelatedField(queryset=Paragraph.objects.all())
    chapter = serializers.SerializerMethodField()
    paragraph_order = serializers.IntegerField(source="paragraph.order", read_only=True)

    class Meta:
        model = Highlight
        fields = [
            "id", "paragraph", "paragraph_order", "chapter", "start_offset", "end_offset",
            "text", "style", "note", "tags", "created_at",
        ]
        extra_kwargs = {"text": {"read_only": True}}

    def get_chapter(self, obj):
        chapter = obj.paragraph.section.chapter
        return {"slug": chapter.slug, "number": chapter.number, "title": chapter.title}

    def validate(self, attrs):
        paragraph = attrs.get("paragraph") or (self.instance.paragraph if self.instance else None)
        start = attrs.get("start_offset", getattr(self.instance, "start_offset", None))
        end = attrs.get("end_offset", getattr(self.instance, "end_offset", None))
        if start is None or end is None or end <= start:
            raise serializers.ValidationError("end_offset must be greater than start_offset.")
        if paragraph and end > len(paragraph.text):
            raise serializers.ValidationError("Highlight extends beyond the paragraph text.")
        # Snapshot the highlighted text server-side so it always matches.
        if paragraph:
            attrs["text"] = paragraph.text[start:end]
        return attrs
