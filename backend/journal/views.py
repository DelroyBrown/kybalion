from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsOwner

from .models import JournalEntry
from .serializers import JournalEntrySerializer


class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["kind", "favourite", "is_draft", "principle__slug", "chapter__slug"]
    search_fields = ["title", "body"]
    ordering_fields = ["updated_at", "created_at", "favourite"]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user).select_related(
            "passage", "principle", "chapter", "prompt"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def export(self, request):
        entries = self.filter_queryset(self.get_queryset())
        response = Response({
            "exported_count": entries.count(),
            "entries": self.get_serializer(entries, many=True).data,
        })
        response["Content-Disposition"] = 'attachment; filename="kybalion-journal.json"'
        return response
