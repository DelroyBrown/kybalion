from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from annotations.models import Annotation
from annotations.serializers import AnnotationSerializer

from .models import Book, Chapter, Paragraph, Passage
from .serializers import (
    BookSerializer,
    ChapterDetailSerializer,
    ChapterListSerializer,
    PassageDetailSerializer,
    PassageLocationSerializer,
)


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Book.objects.prefetch_related("editions", "chapters")
    serializer_class = BookSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    @action(detail=True, methods=["get"])
    def chapters(self, request, slug=None):
        chapters = self.get_object().chapters.filter(is_published=True)
        return Response(ChapterListSerializer(chapters, many=True).data)


def chapter_reader_queryset():
    """Chapter queryset with everything the reader needs, prefetched."""
    passages = Passage.objects.filter(is_published=True).prefetch_related(
        "principles", "annotations__annotation_type"
    )
    paragraphs = Paragraph.objects.prefetch_related(Prefetch("passages", queryset=passages))
    return Chapter.objects.filter(is_published=True).prefetch_related(
        Prefetch("sections__paragraphs", queryset=paragraphs)
    )


class ChapterViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = {"book__slug": ["exact"]}
    pagination_class = None

    def get_queryset(self):
        if self.action == "retrieve":
            return chapter_reader_queryset()
        return Chapter.objects.filter(is_published=True)

    def get_serializer_class(self):
        return ChapterDetailSerializer if self.action == "retrieve" else ChapterListSerializer


class PassageViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    serializer_class = PassageLocationSerializer

    def get_queryset(self):
        qs = Passage.objects.filter(is_published=True).select_related("paragraph__section__chapter")
        chapter = self.request.query_params.get("chapter")
        principle = self.request.query_params.get("principle")
        if chapter:
            qs = qs.filter(paragraph__section__chapter__slug=chapter)
        if principle:
            qs = qs.filter(principles__slug=principle)
        return qs.distinct()

    def get_serializer_class(self):
        return PassageDetailSerializer if self.action == "retrieve" else PassageLocationSerializer

    @action(detail=True, methods=["get"])
    def annotations(self, request, slug=None):
        annotations = (
            self.get_object()
            .annotations.filter(status=Annotation.Status.PUBLISHED)
            .select_related("annotation_type")
            .prefetch_related("sources", "related_principles")
        )
        return Response(AnnotationSerializer(annotations, many=True).data)
