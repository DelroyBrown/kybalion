from django.core.cache import cache
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

    def retrieve(self, request, *args, **kwargs):
        # Chapter content is identical for every reader and only changes on a
        # reseed, so the serialized payload is cached. Scripture books hold
        # thousands of paragraphs; serializing them per request is what made
        # chapters slow to open. Keyed by updated_at, a reseed invalidates.
        slug = self.kwargs[self.lookup_field]
        stamp = (
            Chapter.objects.filter(slug=slug, is_published=True)
            .values_list("updated_at", flat=True)
            .first()
        )
        if stamp is None:
            return super().retrieve(request, *args, **kwargs)  # 404 path
        key = f"chapter-detail:{slug}:{stamp.timestamp()}"
        data = cache.get(key)
        if data is None:
            data = super().retrieve(request, *args, **kwargs).data
            cache.set(key, data, 24 * 60 * 60)
        return Response(data)


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
