from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsOwner
from library.models import Chapter

from .models import ReadingProgress, ReadingSession
from .serializers import ReadingProgressSerializer, ReadingSessionSerializer


class ReadingProgressViewSet(viewsets.ModelViewSet):
    """Progress is an upsert per (user, chapter): POST creates or updates."""

    serializer_class = ReadingProgressSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    pagination_class = None

    def get_queryset(self):
        return ReadingProgress.objects.filter(user=self.request.user).select_related("chapter")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        progress, _ = ReadingProgress.objects.get_or_create(user=request.user, chapter=data["chapter"])
        self._apply(progress, data)
        return Response(self.get_serializer(progress).data, status=status.HTTP_200_OK)

    @staticmethod
    def _apply(progress, data):
        progress.last_paragraph_order = data.get("last_paragraph_order", progress.last_paragraph_order)
        progress.furthest_paragraph_order = max(
            progress.furthest_paragraph_order, data.get("furthest_paragraph_order", 0)
        )
        progress.percent_complete = max(progress.percent_complete, data.get("percent_complete", 0.0))
        if data.get("completed") and not progress.completed:
            progress.completed = True
            progress.completed_at = timezone.now()
        progress.save()

    @action(detail=False, methods=["post"])
    def merge(self, request):
        """Merge locally stored anonymous progress after account creation."""
        entries = request.data.get("entries", [])
        if not isinstance(entries, list):
            return Response(
                {"error": {"code": "invalid", "detail": "entries must be a list", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        merged = 0
        for entry in entries[:100]:
            serializer = self.get_serializer(data=entry)
            if not serializer.is_valid():
                continue
            data = serializer.validated_data
            progress, _ = ReadingProgress.objects.get_or_create(user=request.user, chapter=data["chapter"])
            self._apply(progress, data)
            merged += 1
        return Response({"merged": merged})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        progress = self.get_queryset()
        chapters_total = Chapter.objects.filter(is_published=True).count()
        completed = progress.filter(completed=True).count()
        overall = (
            sum(min(p.percent_complete, 100.0) for p in progress) / chapters_total
            if chapters_total else 0.0
        )
        sessions = ReadingSession.objects.filter(user=request.user)
        total_seconds = sessions.aggregate(total=Sum("duration_seconds"))["total"] or 0
        return Response({
            "chapters_total": chapters_total,
            "chapters_completed": completed,
            "overall_percent": round(overall, 1),
            "session_count": sessions.count(),
            "total_reading_seconds": total_seconds,
        })


class ReadingSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ReadingSessionSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return ReadingSession.objects.filter(user=self.request.user).select_related("chapter")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
