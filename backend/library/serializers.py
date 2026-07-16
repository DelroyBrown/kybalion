from rest_framework import serializers

from annotations.models import Annotation
from annotations.serializers import AnnotationSerializer, VisualisationReferenceSerializer

from .models import Book, Chapter, Edition, Paragraph, Passage, Section


class EditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edition
        fields = ["slug", "name", "publisher", "year", "source_url", "source_notes", "license_note", "is_primary"]


class ChapterListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["slug", "number", "title", "subtitle", "order"]


class BookSerializer(serializers.ModelSerializer):
    editions = EditionSerializer(many=True, read_only=True)
    chapters = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "slug", "title", "subtitle", "author_attribution", "description",
            "published_year", "is_public_domain", "editions", "chapters",
        ]

    def get_chapters(self, obj):
        chapters = obj.chapters.filter(is_published=True)
        return ChapterListSerializer(chapters, many=True).data


class PassageInlineSerializer(serializers.ModelSerializer):
    """Lightweight passage marker embedded in reader payloads."""

    principles = serializers.SlugRelatedField(many=True, read_only=True, slug_field="slug")
    annotation_types = serializers.SerializerMethodField()
    annotation_count = serializers.SerializerMethodField()

    class Meta:
        model = Passage
        fields = [
            "id", "slug", "start_offset", "end_offset", "is_placeholder",
            "principles", "annotation_types", "annotation_count",
        ]

    def _published(self, obj):
        return [a for a in obj.annotations.all() if a.status == Annotation.Status.PUBLISHED]

    def get_annotation_types(self, obj):
        return sorted({a.annotation_type.slug for a in self._published(obj)})

    def get_annotation_count(self, obj):
        return len(self._published(obj))


class ParagraphSerializer(serializers.ModelSerializer):
    passages = PassageInlineSerializer(many=True, read_only=True)

    class Meta:
        model = Paragraph
        fields = ["id", "order", "text", "kind", "is_placeholder", "passages"]


class SectionSerializer(serializers.ModelSerializer):
    paragraphs = ParagraphSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ["id", "slug", "title", "order", "paragraphs"]


class ChapterDetailSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    book = serializers.SlugRelatedField(read_only=True, slug_field="slug")
    previous_chapter = serializers.SerializerMethodField()
    next_chapter = serializers.SerializerMethodField()
    paragraph_count = serializers.SerializerMethodField()
    principles = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = [
            "slug", "number", "title", "subtitle", "introduction", "summary", "book",
            "sections", "previous_chapter", "next_chapter", "paragraph_count", "principles",
        ]

    def _sibling(self, obj, direction):
        qs = Chapter.objects.filter(book=obj.book, is_published=True)
        if direction < 0:
            qs = qs.filter(order__lt=obj.order).order_by("-order")
        else:
            qs = qs.filter(order__gt=obj.order).order_by("order")
        sibling = qs.first()
        return ChapterListSerializer(sibling).data if sibling else None

    def get_previous_chapter(self, obj):
        return self._sibling(obj, -1)

    def get_next_chapter(self, obj):
        return self._sibling(obj, +1)

    def get_paragraph_count(self, obj):
        return Paragraph.objects.filter(section__chapter=obj).count()

    def get_principles(self, obj):
        from principles.models import Principle

        principle_qs = Principle.objects.filter(
            passages__paragraph__section__chapter=obj, is_published=True
        ).distinct()
        return [
            {"slug": p.slug, "name": p.name, "number": p.number, "accent": p.accent, "symbol": p.symbol}
            for p in principle_qs
        ]


class PassageLocationSerializer(serializers.ModelSerializer):
    """A passage with enough location context to link back into the reader."""

    chapter = serializers.SerializerMethodField()
    paragraph_order = serializers.IntegerField(source="paragraph.order", read_only=True)
    section_order = serializers.IntegerField(source="paragraph.section.order", read_only=True)

    class Meta:
        model = Passage
        fields = ["id", "slug", "excerpt", "is_placeholder", "chapter", "section_order", "paragraph_order"]

    def get_chapter(self, obj):
        chapter = obj.paragraph.section.chapter
        return {"slug": chapter.slug, "number": chapter.number, "title": chapter.title}


class PassageDetailSerializer(PassageLocationSerializer):
    """Full annotation-panel payload for a passage."""

    annotations = serializers.SerializerMethodField()
    definitions = serializers.SerializerMethodField()
    related_passages = serializers.SerializerMethodField()
    principles = serializers.SerializerMethodField()
    visualisations = VisualisationReferenceSerializer(many=True, read_only=True)
    paragraph_text = serializers.CharField(source="paragraph.text", read_only=True)

    class Meta(PassageLocationSerializer.Meta):
        fields = PassageLocationSerializer.Meta.fields + [
            "paragraph_text", "start_offset", "end_offset",
            "annotations", "definitions", "related_passages", "principles", "visualisations",
        ]

    def get_annotations(self, obj):
        published = obj.annotations.filter(status=Annotation.Status.PUBLISHED).select_related("annotation_type")
        return AnnotationSerializer(published, many=True).data

    def get_definitions(self, obj):
        return [
            {"slug": d.slug, "term": d.term, "meaning": d.meaning, "etymology": d.etymology}
            for d in obj.definitions.all()
        ]

    def get_related_passages(self, obj):
        results = []
        for rel in obj.related_out.select_related("to_passage__paragraph__section__chapter"):
            results.append({
                "kind": rel.kind, "note": rel.note, "direction": "out",
                "passage": PassageLocationSerializer(rel.to_passage).data,
            })
        for rel in obj.related_in.select_related("from_passage__paragraph__section__chapter"):
            results.append({
                "kind": rel.kind, "note": rel.note, "direction": "in",
                "passage": PassageLocationSerializer(rel.from_passage).data,
            })
        return results

    def get_principles(self, obj):
        return [
            {"slug": p.slug, "name": p.name, "number": p.number, "accent": p.accent, "symbol": p.symbol}
            for p in obj.principles.filter(is_published=True)
        ]
